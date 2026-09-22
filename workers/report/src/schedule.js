import { stockholmParts, previousMonthKey } from "./time.js";
import { collectReportData } from "./data.js";
import { sendReviewEmail, sendFailureEmail, sendReminderEmail } from "./email.js";
import {
  getJson,
  putJson,
  randomToken,
  draftKey,
  finalKey,
  skippedKey,
  errorKey,
  reviewTokenKey
} from "./store.js";

export async function handleScheduled(event, env) {
  const parts = stockholmParts();
  if (parts.hour !== 8) return;
  const period = previousMonthKey();
  const failedBefore = await getJson(env, errorKey(period));
  if (parts.day === 1 || failedBefore) {
    await ensureDraft(env);
  }
  await maybeRemind(env);
}

export async function ensureDraft(env, periodOverride = "") {
  const period = periodOverride || previousMonthKey();
  if (await getJson(env, finalKey(period))) return { status: "already-sent", period };
  if (await getJson(env, skippedKey(period))) return { status: "skipped", period };
  if (await getJson(env, draftKey(period))) return { status: "exists", period };

  try {
    const data = await collectReportData(env, period);
    const token = randomToken(24);
    const draft = {
      period,
      createdAt: new Date().toISOString(),
      token,
      reminderSent: false,
      data
    };
    await putJson(env, draftKey(period), draft);
    await env.SITE_CONFIG.put(reviewTokenKey(token), period);
    await sendReviewEmail(env, data, `${env.REPORT_BASE_URL}/r/${token}`);
    await env.SITE_CONFIG.delete(errorKey(period));
    return { status: "created", period, token };
  } catch (error) {
    const existing = await getJson(env, errorKey(period));
    if (!existing) {
      await putJson(env, errorKey(period), { period, at: new Date().toISOString(), error: String(error) });
      await sendFailureEmail(env, period, error).catch(() => {});
    }
    return { status: "error", period, error: String(error) };
  }
}

async function maybeRemind(env) {
  const period = previousMonthKey();
  const draft = await getJson(env, draftKey(period));
  if (!draft || draft.reminderSent) return;
  const ageMs = Date.now() - new Date(draft.createdAt).getTime();
  if (ageMs < 2 * 24 * 3600 * 1000) return;
  await sendReminderEmail(env, draft.data, `${env.REPORT_BASE_URL}/r/${draft.token}`);
  draft.reminderSent = true;
  await putJson(env, draftKey(period), draft);
}
