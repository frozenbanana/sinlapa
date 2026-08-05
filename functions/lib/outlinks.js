export const OUT_LINKS = {
  foodora: "https://www.foodora.se/restaurant/bjyd/sinlapa",
  wolt: "https://wolt.com/sv/swe/malmo/restaurant/sinlapa",
  ubereats: "https://www.ubereats.com/se-en/store/sinlapa-thai-fusion-bowls/EIsKTdbeXR-qklwahNYaCQ"
};

export const STATS_KEY = "stats:out";

export function resolveOutTarget(to) {
  return OUT_LINKS[String(to || "").toLowerCase().trim()] || null;
}

export async function bumpOutCount(env, key) {
  if (!env?.SITE_CONFIG || !resolveOutTarget(key)) return;
  const current = (await env.SITE_CONFIG.get(STATS_KEY, "json")) || {};
  current[key] = (Number(current[key]) || 0) + 1;
  current.updatedAt = new Date().toISOString();
  await env.SITE_CONFIG.put(STATS_KEY, JSON.stringify(current));
}
