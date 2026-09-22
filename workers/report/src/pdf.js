import { periodLabel } from "./time.js";

export async function renderPdf(env, html, period) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/pdf`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.CF_API_TOKEN}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        html,
        pdfOptions: {
          format: "a4",
          printBackground: true,
          displayHeaderFooter: true,
          margin: { top: "0px", right: "0px", bottom: "64px", left: "0px" },
          footerTemplate: `<div style="width:100%;font-size:9px;color:#8a7f76;text-align:center;padding:0 32px;">Sinlapa · Månadsrapport ${periodLabel(period)} · Sida <span class="pageNumber"></span> av <span class="totalPages"></span></div>`
        }
      })
    }
  );
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Browser Rendering ${response.status}: ${details.slice(0, 300)}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
