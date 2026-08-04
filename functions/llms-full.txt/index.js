import { readConfig } from "../lib/config.js";
import { buildLlmsFullTxt } from "../lib/seo.js";

export async function onRequest(context) {
  const config = await readConfig(context.env);
  const baseUrl = (context.env.SITE_URL || "https://sinlapa.se").replace(/\/$/, "");
  const text = buildLlmsFullTxt(config, baseUrl);
  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
}
