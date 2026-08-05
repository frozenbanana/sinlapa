import { readConfig } from "./lib/config.js";
import { analyticsSnippet, buildRestaurantSchema } from "./lib/seo.js";

function siteUrl(env) {
  return (env.SITE_URL || "https://sinlapa.se").replace(/\/$/, "");
}

function siteLocation(env) {
  const latitude = env.SITE_LAT ? Number(env.SITE_LAT) : null;
  const longitude = env.SITE_LNG ? Number(env.SITE_LNG) : null;
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

export async function onRequest(context) {
  const response = await context.next();
  const config = await readConfig(context.env);
  const schema = buildRestaurantSchema(config, siteUrl(context.env), siteLocation(context.env));

  const script = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n    </script>`;

  let html;
  try {
    html = await response.text();
  } catch {
    return response;
  }

  const replaced = html.includes('type="application/ld+json"')
    ? html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => script)
    : html;

  const beacon = analyticsSnippet(context.env.WEB_ANALYTICS_TOKEN);
  const finalHtml =
    beacon && !replaced.includes("beacon.min.js")
      ? replaced.replace("</body>", `${beacon}\n  </body>`)
      : replaced;

  if (finalHtml === html) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=60");

  return new Response(finalHtml, { status: response.status, headers });
}
