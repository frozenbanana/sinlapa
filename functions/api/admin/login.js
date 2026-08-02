import { getAdminPassword } from "../../lib/auth.js";
import { json } from "../../lib/config.js";

export async function onRequestPost(context) {
  const expected = getAdminPassword(context.env);
  if (!expected) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, 500);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body?.password !== expected) {
    return json({ error: "Fel lösenord" }, 401);
  }

  return json({ ok: true, token: expected });
}
