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
