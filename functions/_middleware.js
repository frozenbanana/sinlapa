export async function onRequest(context) {
  const response = await context.next();
  if (response.status !== 404) return response;

  const pathname = new URL(context.request.url).pathname;
  const contentType = response.headers.get("content-type") || "";
  if (pathname.startsWith("/api/") || contentType.includes("application/json")) {
    return response;
  }

  try {
    await response.body?.cancel();
  } catch {
    // The 404 body is unused once we replace the response.
  }

  return new Response("Sidan finns inte.\n", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=60",
      "x-robots-tag": "noindex"
    }
  });
}
