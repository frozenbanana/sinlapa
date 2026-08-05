import { isAuthorized, unauthorized } from "../../lib/auth.js";
import { json } from "../../lib/config.js";
import { STATS_KEY } from "../../lib/outlinks.js";

export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  const counts = (await context.env.SITE_CONFIG?.get(STATS_KEY, "json")) || {};
  return json(counts, 200, { "cache-control": "no-store" });
}

export async function onRequestDelete(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  await context.env.SITE_CONFIG?.delete(STATS_KEY);
  return json({ ok: true, message: "Utlänkningsräknaren är nollställd." });
}
