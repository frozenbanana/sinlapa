export async function onRequestGet(context) {
  if (!context.env.MEDIA) {
    return new Response("Media storage is not configured", { status: 503 });
  }

  const parts = context.params.key;
  const key = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const object = await context.env.MEDIA.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", object.httpMetadata?.cacheControl || "public, max-age=86400");
  return new Response(object.body, { headers });
}
