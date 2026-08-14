export const CONFIG_KEY = "site-config";

export const DEFAULT_CONFIG = {
  hours: {
    monday: {
      closed: true,
      label: "Stängt",
      periods: []
    },
    tuesday: {
      closed: false,
      label: "11–21 (lunch 11–14)",
      periods: [{ open: "11:00", close: "21:00" }]
    },
    wednesday: {
      closed: false,
      label: "11–21 (lunch 11–14)",
      periods: [{ open: "11:00", close: "21:00" }]
    },
    thursday: {
      closed: false,
      label: "11–21 (lunch 11–14)",
      periods: [{ open: "11:00", close: "21:00" }]
    },
    friday: {
      closed: false,
      label: "11–21.30 (lunch 11–14)",
      periods: [{ open: "11:00", close: "21:30" }]
    },
    saturday: {
      closed: false,
      label: "16–21.30",
      periods: [{ open: "16:00", close: "21:30" }]
    },
    sunday: {
      closed: false,
      label: "16–21.30",
      periods: [{ open: "16:00", close: "21:30" }]
    }
  },
  lunch: {
    price: "139 kr",
    hoursLabel: "Måndag–fredag 11–14",
    weekLabel: "Den här veckan",
    title: "Lunch hos Sinlapa",
    included: "Valfri dryck",
    items: [
      {
        tag: "Populär",
        name: "Dagens Thai Fusion Bowl",
        description: "Kockens val med säsongens grönsaker, jasminris och husets sås.",
        note: "Går att få vegansk"
      },
      {
        tag: "Vegetarisk",
        name: "Veckans Veggie",
        description: "Färska grönsaker, örter, krispigt tillbehör och balanserad hetta.",
        note: "Fråga oss om allergener"
      }
    ]
  },
  updatedAt: null
};

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

function normalizePeriod(period) {
  if (!period || typeof period !== "object") return null;
  const open = String(period.open || "").trim();
  const close = String(period.close || "").trim();
  if (!open || !close) return null;
  return { open, close };
}

function buildHoursLabel(day) {
  if (day.closed || !day.periods?.length) return "Stängt";
  return day.periods.map((period) => {
    const open = period.open.replace(/^0/, "").replace(":00", "");
    const close = period.close.replace(/^0/, "").replace(":00", "");
    return `${open}–${close}`;
  }).join(", ");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeConfig(input = {}) {
  const base = clone(DEFAULT_CONFIG);
  const hours = input.hours || {};
  const lunch = input.lunch || {};

  for (const day of DAY_KEYS) {
    const incoming = hours[day] || {};
    const periods = Array.isArray(incoming.periods)
      ? incoming.periods.map(normalizePeriod).filter(Boolean)
      : base.hours[day].periods;
    const closed = Boolean(incoming.closed) || periods.length === 0;
    base.hours[day] = {
      closed,
      periods: closed ? [] : periods,
      label: closed ? "Stängt" : (incoming.label?.trim() || buildHoursLabel({ closed, periods }))
    };
  }

  const items = Array.isArray(lunch.items) ? lunch.items : base.lunch.items;
  base.lunch = {
    price: String(lunch.price || base.lunch.price).trim() || base.lunch.price,
    hoursLabel: String(lunch.hoursLabel || base.lunch.hoursLabel).trim() || base.lunch.hoursLabel,
    weekLabel: String(lunch.weekLabel || base.lunch.weekLabel).trim() || base.lunch.weekLabel,
    title: String(lunch.title || base.lunch.title).trim() || base.lunch.title,
    included: String(lunch.included || base.lunch.included).trim() || base.lunch.included,
    items: items.slice(0, 4).map((item) => ({
      tag: String(item?.tag || "").trim(),
      name: String(item?.name || "").trim(),
      description: String(item?.description || "").trim(),
      note: String(item?.note || "").trim(),
      imageUrl: String(item?.imageUrl || "").trim(),
      imageKey: String(item?.imageKey || "").trim()
    })).filter((item) => item.name)
  };

  if (!base.lunch.items.length) {
    base.lunch.items = clone(DEFAULT_CONFIG.lunch.items);
  }

  base.updatedAt = input.updatedAt || null;
  return base;
}

export async function readConfig(env) {
  if (!env.SITE_CONFIG) {
    return normalizeConfig(DEFAULT_CONFIG);
  }

  try {
    const stored = await env.SITE_CONFIG.get(CONFIG_KEY, "json");
    return normalizeConfig(stored || DEFAULT_CONFIG);
  } catch {
    return normalizeConfig(DEFAULT_CONFIG);
  }
}

export async function writeConfig(env, config) {
  const next = normalizeConfig({
    ...config,
    updatedAt: new Date().toISOString()
  });
  await env.SITE_CONFIG.put(CONFIG_KEY, JSON.stringify(next));
  return next;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}
