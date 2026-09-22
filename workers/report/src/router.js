import { ensureDraft } from "./schedule.js";
import {
  getJson,
  finalKey,
  pdfKey,
  reviewTokenKey,
  draftKey,
  webTokenKey,
  readIndex
} from "./store.js";
import { renderReport } from "./report.js";
import { renderReviewPage, renderResultPage } from "./review.js";
import { approveDraft, skipDraft } from "./actions.js";
import { previousMonthKey } from "./time.js";

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      ...headers
    }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function isAdmin(request, env) {
  const header = request.headers.get("authorization") || "";
  return Boolean(env.ADMIN_PASSWORD) && header === `Bearer ${env.ADMIN_PASSWORD}`;
}

async function handleTest(request, env) {
  if (!isAdmin(request, env)) {
    return json({ error: "Unauthorized" }, 401);
  }
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || previousMonthKey();
  const force = url.searchParams.get("force") === "1";
  if (force) {
    await env.SITE_CONFIG.delete(draftKey(period));
  }
  const result = await ensureDraft(env, period);
  return json(result, result.status === "error" ? 500 : 200);
}

async function loadDraftByToken(env, token) {
  const period = await env.SITE_CONFIG.get(reviewTokenKey(token));
  if (!period) return null;
  const draft = await getJson(env, draftKey(period));
  if (!draft) return null;
  return { period, draft };
}

async function previewDraft(env, token) {
  const found = await loadDraftByToken(env, token);
  if (!found) {
    return html(renderResultPage({ title: "Länken är ogiltig", message: "Utkastet finns inte eller är redan hanterat." }), 404);
  }
  const report = renderReport(found.draft.data, { mode: "web", showCta: false });
  return html(report.html);
}

async function reviewPage(env, token) {
  const found = await loadDraftByToken(env, token);
  if (!found) {
    return html(
      renderResultPage({
        title: "Länken är ogiltig eller redan använd",
        message: "Utkastet finns inte längre. Nästa rapport skapas automatiskt den 1:a."
      }),
      404
    );
  }
  return html(renderReviewPage(found.draft.data, token));
}

async function submitReview(request, env, token) {
  const form = await request.formData();
  const action = String(form.get("action") || "");
  const recommendation = String(form.get("recommendation") || "");
  const note = String(form.get("note") || "");

  if (action === "skip") {
    try {
      await skipDraft(env, token);
      return html(
        renderResultPage({
          title: "Rapporten hoppades över",
          message: "Inget skickades till Sinlapa denna månad. Nästa rapport skapas automatiskt den 1:a."
        })
      );
    } catch (error) {
      return html(
        renderResultPage({ title: "Kunde inte hoppa över", message: String(error.message || error), tone: "error" }),
        400
      );
    }
  }

  if (action !== "approve") {
    return html(renderResultPage({ title: "Okänd åtgärd", message: "Försök igen från granskningssidan." }), 400);
  }

  try {
    const result = await approveDraft(env, token, { recommendation, note });
    return html(
      renderResultPage({
        title: "Rapporten är skickad",
        message: `Månadsrapporten skickades till info@sinlapa.se med dig på BCC. <br /><br />Webbversion: <a href="${result.webUrl}">${result.webUrl}</a>`
      })
    );
  } catch (error) {
    const found = await loadDraftByToken(env, token);
    if (!found) {
      return html(renderResultPage({ title: "Kunde inte skicka", message: String(error.message || error) }), 400);
    }
    const data = { ...found.draft.data, recommendation, note };
    return html(renderReviewPage(data, token, String(error.message || error)), 500);
  }
}

async function serveReport(env, token) {
  const period = await env.SITE_CONFIG.get(webTokenKey(token));
  if (!period) {
    return html(renderResultPage({ title: "Rapporten finns inte", message: "Länken är ogiltig." }), 404);
  }
  const final = await getJson(env, finalKey(period));
  if (!final?.html) {
    return html(renderResultPage({ title: "Rapporten finns inte", message: "Länken är ogiltig." }), 404);
  }
  return html(final.html);
}

async function servePdf(env, token) {
  const period = await env.SITE_CONFIG.get(webTokenKey(token));
  if (!period) return new Response("Not found", { status: 404 });
  const bytes = await env.SITE_CONFIG.get(pdfKey(period), "arrayBuffer");
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(bytes, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="sinlapa-manadsrapport-${period}.pdf"`,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && path === "/healthz") {
    return new Response("ok", { headers: { "cache-control": "no-store" } });
  }

  if (path === "/api/test") {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    return handleTest(request, env);
  }

  if (request.method === "GET" && path === "/api/index") {
    if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    return json(await readIndex(env));
  }

  const reviewMatch = path.match(/^\/r\/([a-f0-9]{16,64})(\/preview)?$/);
  if (reviewMatch) {
    const token = reviewMatch[1];
    if (request.method === "GET" && reviewMatch[2]) return previewDraft(env, token);
    if (request.method === "GET") return reviewPage(env, token);
    if (request.method === "POST") return submitReview(request, env, token);
  }

  const reportMatch = path.match(/^\/report\/([a-f0-9]{16,64})(\/pdf)?$/);
  if (request.method === "GET" && reportMatch) {
    return reportMatch[2] ? servePdf(env, reportMatch[1]) : serveReport(env, reportMatch[1]);
  }

  return html(
    renderResultPage({
      title: "Hittades inte",
      message: "Sidan finns inte. Rapporter nås via länkarna i utskicksmailet."
    }),
    404
  );
}
