import {
  getJson,
  putJson,
  randomToken,
  draftKey,
  finalKey,
  pdfKey,
  reviewTokenKey,
  webTokenKey,
  skippedKey,
  addToIndex
} from "./store.js";
import { renderReport } from "./report.js";
import { renderPdf } from "./pdf.js";
import { sendCustomerEmail, sendConfirmationEmail } from "./email.js";

export async function approveDraft(env, token, { recommendation, note }) {
  const period = await env.SITE_CONFIG.get(reviewTokenKey(token));
  if (!period) {
    throw new Error("Länken är ogiltig eller redan använd.");
  }
  const draft = await getJson(env, draftKey(period));
  if (!draft?.data) {
    throw new Error("Utkastet finns inte längre.");
  }

  draft.data.recommendation = String(recommendation ?? draft.data.recommendation ?? "").trim().slice(0, 1200);
  draft.data.note = String(note ?? "").trim().slice(0, 800);

  const webToken = randomToken(24);
  const webUrl = `${env.REPORT_BASE_URL}/report/${webToken}`;

  const pdfSource = renderReport(draft.data, { mode: "pdf", webUrl, showCta: false, footerLink: `Webbversion: ${webUrl}` });
  const webSource = renderReport(draft.data, { mode: "web", showCta: false });
  const pdfBytes = await renderPdf(env, pdfSource.html, period);

  await sendCustomerEmail(env, draft.data, { webUrl, pdfBytes });

  await env.SITE_CONFIG.put(pdfKey(period), pdfBytes);
  await env.SITE_CONFIG.put(webTokenKey(webToken), period);
  await putJson(env, finalKey(period), {
    period,
    sentAt: new Date().toISOString(),
    webToken,
    subject: pdfSource.subject,
    html: webSource.html,
    data: draft.data
  });
  await addToIndex(env, {
    period,
    sentAt: new Date().toISOString(),
    webUrl,
    pdfUrl: `${env.REPORT_BASE_URL}/report/${webToken}/pdf`,
    subject: pdfSource.subject
  });
  await sendConfirmationEmail(env, draft.data, { webUrl });
  await env.SITE_CONFIG.delete(draftKey(period));
  await env.SITE_CONFIG.delete(reviewTokenKey(token));

  return { period, webUrl };
}

export async function skipDraft(env, token) {
  const period = await env.SITE_CONFIG.get(reviewTokenKey(token));
  if (!period) {
    throw new Error("Länken är ogiltig eller redan använd.");
  }
  await putJson(env, skippedKey(period), { period, skippedAt: new Date().toISOString() });
  await env.SITE_CONFIG.delete(draftKey(period));
  await env.SITE_CONFIG.delete(reviewTokenKey(token));
  return { period };
}
