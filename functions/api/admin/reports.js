import { isAuthorized, unauthorized } from "../../lib/auth.js";
import { json } from "../../lib/config.js";
import { monthKey } from "../../lib/stats.js";

const INDEX_KEY = "report:index";

export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  const store = context.env.SITE_CONFIG;
  const reports = (await store?.get(INDEX_KEY, "json")) || [];
  const month = monthKey();
  const stats = {
    month,
    forms: (await store?.get(`stats:forms:${month}`, "json")) || {},
    out: (await store?.get(`stats:out:${month}`, "json")) || {}
  };

  return json({ reports, stats }, 200, { "cache-control": "no-store" });
}
