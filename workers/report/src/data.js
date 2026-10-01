import { periodRange, previousPeriod, periodLabel, formatNumber } from "./time.js";
import { pageLabel, selectTopPages, trackedPaths } from "./pages.js";

async function graphql(env, query) {
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CF_API_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ query })
  });
  const data = await response.json();
  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "));
  }
  return data.data;
}

const QUERY_MODES = [
  { order: true, restrictPaths: true, excludeBots: true },
  { order: true, restrictPaths: false, excludeBots: true },
  { order: false, restrictPaths: false, excludeBots: false }
];

export function buildTrafficQuery(env, range, options = {}) {
  const { order = true, restrictPaths = true, excludeBots = true } = options;
  const filters = [
    `siteTag: "${env.RUM_SITE_TAG}"`,
    `date_geq: "${range.start}"`,
    `date_leq: "${range.end}"`
  ];
  const hosts = (env.RUM_HOST_FILTER || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)
    .map((host) => `"${host}"`)
    .join(", ");
  if (hosts) filters.push(`requestHost_in: [${hosts}]`);
  if (excludeBots) filters.push("bot: 0");
  if (restrictPaths) {
    const paths = trackedPaths()
      .map((path) => `"${path}"`)
      .join(", ");
    filters.push(`requestPath_in: [${paths}]`);
  }
  const filter = filters.join(", ");
  const orderBy = order ? ", orderBy: [count_DESC]" : "";
  const pageLimit = restrictPaths ? 40 : 1000;
  return `{
    viewer {
      accounts(filter: { accountTag: "${env.CF_ACCOUNT_ID}" }) {
        totals: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { ${filter} }) {
          count
          avg { sampleInterval }
          sum { visits }
        }
        pages: rumPageloadEventsAdaptiveGroups(limit: ${pageLimit}, filter: { ${filter} }${orderBy}) {
          count
          avg { sampleInterval }
          dimensions { requestPath }
        }
      }
    }
  }`;
}

function readTraffic(data) {
  const account = data?.viewer?.accounts?.[0] || {};
  const totals = account.totals?.[0] || {};
  const totalInterval = Number(totals.avg?.sampleInterval) || 1;
  const pages = (account.pages || []).map((page) => ({
    path: page.dimensions?.requestPath || "/",
    count: Number(page.count) || 0,
    sampleInterval: Number(page.avg?.sampleInterval) || totalInterval
  }));
  return {
    visits: Number(totals.sum?.visits) || 0,
    pageViews: Number(totals.count) || 0,
    sampleInterval: totalInterval,
    pages
  };
}

async function queryTraffic(env, range) {
  let lastError;
  for (const mode of QUERY_MODES) {
    try {
      const traffic = readTraffic(await graphql(env, buildTrafficQuery(env, range, mode)));
      return {
        visits: traffic.visits,
        pageViews: traffic.pageViews,
        sampleInterval: traffic.sampleInterval,
        topPages: selectTopPages(traffic.pages)
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function trafficNote(current) {
  if (!current.pageViews) return "Ingen trafik registrerades under perioden.";
  if (current.sampleInterval > 1) {
    const step = Math.max(1, Math.round(current.sampleInterval));
    return `Äldre trafik mäts i ett urval och avrundas till ungefär ${formatNumber(step)}.`;
  }
  return "";
}

function isPartial(period, startedAt) {
  if (!startedAt) return true;
  return startedAt.slice(0, 7) === period;
}

async function collectTraffic(env, period) {
  if (!env.RUM_SITE_TAG || !env.CF_API_TOKEN) {
    return { available: false, partial: false, note: "Trafikmätning är inte aktiverad ännu." };
  }
  try {
    const [current, previous] = await Promise.all([
      queryTraffic(env, periodRange(period)),
      queryTraffic(env, periodRange(previousPeriod(period)))
    ]);
    return {
      available: true,
      visits: current.visits,
      pageViews: current.pageViews,
      topPages: current.topPages,
      prev: previous,
      partial: false,
      note: trafficNote(current)
    };
  } catch (error) {
    return { available: false, partial: false, note: `Kunde inte hämta trafikstatistik (${error.message}).` };
  }
}

async function collectCounters(env, prefix, period) {
  const [current, previous] = await Promise.all([
    env.SITE_CONFIG.get(`stats:${prefix}:${period}`, "json"),
    env.SITE_CONFIG.get(`stats:${prefix}:${previousPeriod(period)}`, "json")
  ]);
  return { current: current || {}, previous: previous || {} };
}

async function collectClicks(env, period, startedAt) {
  const { current, previous } = await collectCounters(env, "out", period);
  const foodora = Number(current.foodora) || 0;
  const wolt = Number(current.wolt) || 0;
  const previousFoodora = Number(previous.foodora) || 0;
  const previousWolt = Number(previous.wolt) || 0;
  const hasPrevious = Object.keys(previous).length > 0;
  const partial = isPartial(period, startedAt);
  return {
    foodora,
    wolt,
    total: foodora + wolt,
    prev: hasPrevious ? { foodora: previousFoodora, wolt: previousWolt, total: previousFoodora + previousWolt } : null,
    partial,
    note: partial ? "Räknaren startade under månaden – siffrorna gäller från och med aktiveringen." : ""
  };
}

async function collectForms(env, period, startedAt) {
  const { current, previous } = await collectCounters(env, "forms", period);
  const booking = Number(current.booking) || 0;
  const catering = Number(current.catering) || 0;
  const previousBooking = Number(previous.booking) || 0;
  const previousCatering = Number(previous.catering) || 0;
  const hasPrevious = Object.keys(previous).length > 0;
  const partial = isPartial(period, startedAt);
  return {
    booking,
    catering,
    total: booking + catering,
    prev: hasPrevious ? { booking: previousBooking, catering: previousCatering, total: previousBooking + previousCatering } : null,
    partial,
    note: partial ? "Räknaren startade under månaden – siffrorna gäller från och med aktiveringen." : ""
  };
}

async function check(env, { label, url, method = "GET", body, expect = 200 }) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body
    });
    const ms = Date.now() - started;
    return { label, ok: response.status === expect, status: response.status, ms };
  } catch (error) {
    return { label, ok: false, status: 0, ms: Date.now() - started, detail: error.message };
  }
}

async function collectHealth(env) {
  const base = env.SITE_URL;
  const checks = await Promise.all([
    check(env, { label: "Startsidan svarar", url: `${base}/` }),
    check(env, { label: "Innehålls-API", url: `${base}/api/site-config` }),
    check(env, {
      label: "Bokningsformuläret svarar",
      url: `${base}/api/contact`,
      method: "POST",
      body: '{"type":"booking"}',
      expect: 400
    }),
    check(env, { label: "Sitemap", url: `${base}/sitemap.xml` }),
    check(env, { label: "AI-filen llms.txt", url: `${base}/llms.txt` })
  ]);
  return { checks, ok: checks.every((item) => item.ok) };
}

function buildRecommendation(period, { traffic, clicks, forms }) {
  const monthLabel = periodLabel(period).toLowerCase();
  const parts = [];
  const suggestions = [];

  if (traffic.available) {
    parts.push(`Under ${monthLabel} hade sinlapa.se ${formatNumber(traffic.visits)} besök och ${formatNumber(traffic.pageViews)} sidvisningar.`);
    const top = traffic.topPages?.[0];
    if (top && top.count > 0) {
      const topLabel = pageLabel(top.path);
      parts.push(`Mest besökt var ${topLabel.toLowerCase()} (${formatNumber(top.count)} visningar).`);
      if (/lunch/i.test(topLabel)) {
        suggestions.push("publicera veckans lunch redan på måndag morgon och lyft den i sociala medier – lunchsidan är den mest besökta");
      }
    }
  } else {
    parts.push(`Trafikstatistiken för ${monthLabel} kunde inte hämtas denna gång.`);
  }

  if (clicks.total > 0) {
    const leader = clicks.foodora >= clicks.wolt ? "Foodora" : "Wolt";
    const other = clicks.foodora >= clicks.wolt ? "Wolt" : "Foodora";
    const leaderCount = Math.max(clicks.foodora, clicks.wolt);
    const otherCount = Math.min(clicks.foodora, clicks.wolt);
    parts.push(`${leader} var den populäraste beställningskanalen med ${formatNumber(leaderCount)} klick (${other}: ${formatNumber(otherCount)}).`);
    suggestions.push(`behåll ${leader}-länken tydligt framme och kontrollera att menyn där är uppdaterad`);
  }

  if (forms.total > 0) {
    parts.push(`Via webbplatsen kom ${formatNumber(forms.booking)} bordsbokningar och ${formatNumber(forms.catering)} cateringförfrågningar.`);
    suggestions.push("följ upp förfrågningar snabbt och be gäster om ett omdöme efter besöket");
  }

  if (!parts.length) {
    parts.push(`Rapporten för ${monthLabel} har begränsat med data ännu.`);
    suggestions.push("aktivera trafikmätning och uppdatera veckans lunch regelbundet för bättre underlag");
  }

  const suggestion = suggestions[0] || "uppdatera veckans lunch och en bild i admin inför nästa månad";
  return `${parts.join(" ")} Förslag: ${suggestion}.`;
}

export async function collectReportData(env, period) {
  const startedAt = await env.SITE_CONFIG.get("stats:startedAt");
  const [traffic, clicks, forms, health] = await Promise.all([
    collectTraffic(env, period),
    collectClicks(env, period, startedAt),
    collectForms(env, period, startedAt),
    collectHealth(env)
  ]);
  return {
    period,
    generatedAt: new Date().toISOString(),
    startedAt: startedAt || null,
    traffic,
    clicks,
    forms,
    health,
    recommendation: buildRecommendation(period, { traffic, clicks, forms }),
    note: ""
  };
}
