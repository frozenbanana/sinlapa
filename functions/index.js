import { readConfig } from "./lib/config.js";
import { analyticsSnippet, buildRestaurantSchema } from "./lib/seo.js";

const CANONICAL_ORIGIN = "https://sinlapa.se";

function siteUrl(env) {
  return (env.SITE_URL || CANONICAL_ORIGIN).replace(/\/$/, "");
}

function siteLocation(env) {
  const latitude = env.SITE_LAT ? Number(env.SITE_LAT) : null;
  const longitude = env.SITE_LNG ? Number(env.SITE_LNG) : null;
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function requestOrigin(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

/** Point social preview assets at a host that can actually serve them. */
function socialAssetOrigin(request, env) {
  const origin = requestOrigin(request);
  if (/pages\.dev$|localhost|127\.0\.0\.1/.test(new URL(origin).hostname)) {
    return origin;
  }
  return siteUrl(env);
}

function applySocialMeta(html, request, env) {
  const canonical = `${siteUrl(env)}/`;
  const assetOrigin = socialAssetOrigin(request, env);
  const image = `${assetOrigin}/assets/hero.webp`;
  const pageUrl = `${assetOrigin}/`;

  return html
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${canonical}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${pageUrl}" />`
    )
    .replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${image}" />`
    )
    .replace(
      /<meta property="og:image:secure_url" content="[^"]*"\s*\/?>/,
      `<meta property="og:image:secure_url" content="${image}" />`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${image}" />`
    );
}

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const config = await readConfig(context.env);
  const schema = buildRestaurantSchema(config, siteUrl(context.env), siteLocation(context.env));

  const script = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n    </script>`;

  let html;
  try {
    html = await response.text();
  } catch {
    return response;
  }

  let replaced = html.includes('type="application/ld+json"')
    ? html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => script)
    : html;

  replaced = applySocialMeta(replaced, context.request, context.env);

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
