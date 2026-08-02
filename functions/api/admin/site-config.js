import { isAuthorized, unauthorized } from "../../lib/auth.js";
import { json, readConfig, writeConfig } from "../../lib/config.js";

export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  const config = await readConfig(context.env);
  return json(config);
}

export async function onRequestPut(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  if (!context.env.SITE_CONFIG) {
    return json({ error: "SITE_CONFIG KV binding is missing" }, 500);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const saved = await writeConfig(context.env, body);
  return json({ ok: true, config: saved });
}
