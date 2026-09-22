export const TIME_ZONE = "Europe/Stockholm";

export function monthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export async function bumpMonthly(env, group, key) {
  if (!env?.SITE_CONFIG) return;
  const storageKey = `stats:${group}:${monthKey()}`;
  const [current, startedAt] = await Promise.all([
    env.SITE_CONFIG.get(storageKey, "json"),
    env.SITE_CONFIG.get("stats:startedAt")
  ]);
  if (!startedAt) {
    await env.SITE_CONFIG.put("stats:startedAt", new Date().toISOString());
  }
  const next = current || {};
  next[key] = (Number(next[key]) || 0) + 1;
  next.updatedAt = new Date().toISOString();
  await env.SITE_CONFIG.put(storageKey, JSON.stringify(next));
}
