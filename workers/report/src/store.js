export async function getJson(env, key) {
  return (await env.SITE_CONFIG.get(key, "json")) || null;
}

export async function putJson(env, key, value) {
  await env.SITE_CONFIG.put(key, JSON.stringify(value));
}

export function randomToken(bytes = 24) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const draftKey = (period) => `report:draft:${period}`;
export const finalKey = (period) => `report:final:${period}`;
export const pdfKey = (period) => `report:pdf:${period}`;
export const reviewTokenKey = (token) => `report:review:${token}`;
export const webTokenKey = (token) => `report:web:${token}`;
export const skippedKey = (period) => `report:skipped:${period}`;
export const errorKey = (period) => `report:error:${period}`;
export const indexKey = "report:index";

export async function readIndex(env) {
  return (await getJson(env, indexKey)) || [];
}

export async function addToIndex(env, entry) {
  const index = await readIndex(env);
  const next = [entry, ...index.filter((item) => item.period !== entry.period)];
  await putJson(env, indexKey, next);
  return next;
}

export async function cleanupPeriod(env, period) {
  const removed = [];
  const draft = await getJson(env, draftKey(period));
  if (draft?.token) {
    await env.SITE_CONFIG.delete(reviewTokenKey(draft.token));
    removed.push(reviewTokenKey(draft.token));
  }
  const final = await getJson(env, finalKey(period));
  if (final?.webToken) {
    await env.SITE_CONFIG.delete(webTokenKey(final.webToken));
    removed.push(webTokenKey(final.webToken));
  }
  for (const key of [draftKey(period), finalKey(period), pdfKey(period), skippedKey(period), errorKey(period)]) {
    const existing = await env.SITE_CONFIG.get(key);
    if (existing !== null) {
      await env.SITE_CONFIG.delete(key);
      removed.push(key);
    }
  }
  const index = await readIndex(env);
  const next = index.filter((item) => item.period !== period);
  if (next.length !== index.length) {
    await putJson(env, indexKey, next);
    removed.push(indexKey);
  }
  return removed;
}
