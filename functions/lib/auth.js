export function getAdminPassword(env) {
  return env.ADMIN_PASSWORD || "";
}

export function isAuthorized(request, env) {
  const expected = getAdminPassword(env);
  if (!expected) return false;

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7) === expected;
  }

  const submitted = request.headers.get("x-admin-password") || "";
  return submitted === expected;
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
