import { bumpOutCount, resolveOutTarget } from "../lib/outlinks.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const to = url.searchParams.get("to");
  const target = resolveOutTarget(to);
  if (!target) {
    return new Response("Not found", { status: 404 });
  }
  await bumpOutCount(context.env, to);
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      "Cache-Control": "no-store"
    }
  });
}
