import { periodLabel, previousPeriod, formatNumber, formatDateSv } from "./time.js";

const COLORS = {
  ink: "#17120f",
  inkSoft: "#2a211c",
  cream: "#f4ecdf",
  paper: "#fbf7f0",
  orange: "#f06b25",
  sage: "#6c7556",
  muted: "#8a7f76",
  line: "#e6dccb",
  up: "#3f7d4e",
  down: "#b3402e"
};

const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function deltaHtml(current, previous, previousLabel) {
  if (previous == null) {
    return `<span style="color:${COLORS.muted};">Ny mätning</span>`;
  }
  if (previous === 0) {
    return current > 0
      ? `<span style="color:${COLORS.muted};">Ny mätning</span>`
      : `<span style="color:${COLORS.muted};">Oförändrat</span>`;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) {
    return `<span style="color:${COLORS.muted};">Oförändrat</span>`;
  }
  const color = change > 0 ? COLORS.up : COLORS.down;
  const sign = change > 0 ? "+" : "−";
  return `<span style="color:${color};font-weight:600;">${sign}${Math.abs(change)} %</span> <span style="color:${COLORS.muted};">vs ${previousLabel}</span>`;
}

function statCard(label, value, delta) {
  return `
    <td width="50%" style="padding:6px;vertical-align:top;">
      <div style="background-color:${COLORS.cream};border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.sage};font-weight:700;">${escapeHtml(label)}</div>
        <div style="font-size:30px;line-height:1.2;color:${COLORS.ink};font-weight:800;margin-top:6px;">${escapeHtml(value)}</div>
        <div style="font-size:12px;margin-top:4px;">${delta}</div>
      </div>
    </td>`;
}

function sectionTitle(text) {
  return `<h2 style="margin:0 0 12px;font-size:17px;color:${COLORS.ink};border-bottom:2px solid ${COLORS.orange};padding-bottom:8px;display:inline-block;">${escapeHtml(text)}</h2>`;
}

function section(inner, isLast = false) {
  return `
    <tr><td style="padding:${isLast ? "8px 32px 28px" : "8px 32px"};">
      ${inner}
    </td></tr>`;
}

function dataNote(note) {
  if (!note) return "";
  return `<p style="margin:8px 0 0;font-size:12px;color:${COLORS.muted};font-style:italic;">${escapeHtml(note)}</p>`;
}

function tableRow(label, value, delta) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.inkSoft};">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};font-weight:700;text-align:right;white-space:nowrap;">${escapeHtml(value)}</td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid ${COLORS.line};font-size:12px;text-align:right;white-space:nowrap;">${delta}</td>
    </tr>`;
}

function topPagesList(pages) {
  if (!pages?.length) return "";
  const rows = pages
    .map(
      (page, index) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${COLORS.inkSoft};">${index + 1}. ${escapeHtml(pageLabel(page.path))}</td>
        <td style="padding:6px 0;font-size:13px;color:${COLORS.ink};font-weight:600;text-align:right;">${formatNumber(page.count)}</td>
      </tr>`
    )
    .join("");
  return `
    <div style="margin-top:16px;">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.sage};font-weight:700;margin-bottom:4px;">Populäraste sidorna</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    </div>`;
}

const PAGE_LABELS = {
  "/": "Startsidan",
  "/index.html": "Startsidan",
  "/#lunch": "Lunch",
  "/dagens-lunch": "Lunch",
  "/#meny": "Menyn",
  "/#boka": "Bordbokning",
  "/#catering": "Catering",
  "/#kontakt": "Kontakt",
  "/erbjudande": "Erbjudande"
};

function pageLabel(path) {
  return PAGE_LABELS[path] || path;
}

function healthRow(item) {
  const color = item.ok ? COLORS.up : COLORS.down;
  const label = item.ok ? "OK" : "Fel";
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${COLORS.line};font-size:13px;color:${COLORS.inkSoft};">${escapeHtml(item.label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${COLORS.line};font-size:12px;color:${COLORS.muted};text-align:right;">${formatNumber(item.ms)} ms</td>
      <td style="padding:8px 0 8px 14px;border-bottom:1px solid ${COLORS.line};font-size:12px;font-weight:700;color:${color};text-align:right;">${label}</td>
    </tr>`;
}

export function renderReport(data, options = {}) {
  const { mode = "email", webUrl = "", ctaLabel = "Se rapporten online", banner = "", showCta = true, footerLink = "" } = options;
  const period = data.period;
  const monthLabel = periodLabel(period);
  const previousLabel = periodLabel(previousPeriod(period)).toLowerCase();
  const isPdf = mode === "pdf";

  const traffic = data.traffic || {};
  const clicks = data.clicks || {};
  const forms = data.forms || {};
  const health = data.health || { checks: [] };

  const stats = `
    <tr><td style="padding:20px 26px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${statCard("Besök", traffic.available ? formatNumber(traffic.visits) : "–", traffic.available ? deltaHtml(traffic.visits, traffic.prev?.visits, previousLabel) : `<span style="color:${COLORS.muted};">Ingen data</span>`)}
          ${statCard("Sidvisningar", traffic.available ? formatNumber(traffic.pageViews) : "–", traffic.available ? deltaHtml(traffic.pageViews, traffic.prev?.pageViews, previousLabel) : `<span style="color:${COLORS.muted};">Ingen data</span>`)}
        </tr>
        <tr>
          ${statCard("Klick till beställning", formatNumber(clicks.total), deltaHtml(clicks.total, clicks.prev?.total ?? null, previousLabel))}
          ${statCard("Bokningar & förfrågningar", formatNumber(forms.total), deltaHtml(forms.total, forms.prev?.total ?? null, previousLabel))}
        </tr>
      </table>
    </td></tr>`;

  const trafficSection = traffic.available
    ? section(`
        ${sectionTitle("Trafik")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${tableRow("Besök", formatNumber(traffic.visits), deltaHtml(traffic.visits, traffic.prev?.visits, previousLabel))}
          ${tableRow("Sidvisningar", formatNumber(traffic.pageViews), deltaHtml(traffic.pageViews, traffic.prev?.pageViews, previousLabel))}
        </table>
        ${topPagesList(traffic.topPages)}
        ${dataNote(traffic.note)}
      `)
    : section(`
        ${sectionTitle("Trafik")}
        <p style="margin:0;font-size:14px;color:${COLORS.inkSoft};">${escapeHtml(traffic.note || "Trafikstatistik saknas.")}</p>
      `);

  const clicksSection = section(`
    ${sectionTitle("Beställningar")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${tableRow("Foodora – klick", formatNumber(clicks.foodora), deltaHtml(clicks.foodora, clicks.prev?.foodora ?? null, previousLabel))}
      ${tableRow("Wolt – klick", formatNumber(clicks.wolt), deltaHtml(clicks.wolt, clicks.prev?.wolt ?? null, previousLabel))}
    </table>
    ${dataNote(clicks.note)}
  `);

  const formsSection = section(`
    ${sectionTitle("Bokningar & catering")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${tableRow("Bordsbokningar", formatNumber(forms.booking), deltaHtml(forms.booking, forms.prev?.booking ?? null, previousLabel))}
      ${tableRow("Cateringförfrågningar", formatNumber(forms.catering), deltaHtml(forms.catering, forms.prev?.catering ?? null, previousLabel))}
    </table>
    ${dataNote(forms.note)}
  `);

  const healthSection = section(`
    ${sectionTitle("Sidans hälsa")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${health.checks.map(healthRow).join("")}
    </table>
  `);

  const recommendationSection = section(`
    ${sectionTitle("Rekommendation")}
    <div style="background-color:${COLORS.cream};border-left:4px solid ${COLORS.orange};border-radius:0 12px 12px 0;padding:16px 18px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.inkSoft};">${escapeHtml(data.recommendation || "")}</p>
    </div>
  `);

  const noteSection = data.note
    ? section(`
        ${sectionTitle("Kommentar")}
        <div style="background-color:${COLORS.ink};border-radius:12px;padding:16px 18px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.cream};">${escapeHtml(data.note)}</p>
        </div>
      `)
    : "";

  const ctaSection =
    showCta && webUrl
      ? section(
          `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px auto 0;">
          <tr><td style="background-color:${COLORS.orange};border-radius:999px;">
            <a href="${escapeHtml(webUrl)}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:${COLORS.ink};text-decoration:none;">${escapeHtml(ctaLabel)}</a>
          </td></tr>
        </table>
      `,
          true
        )
      : "";

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.cream};">
      <tr><td align="center" style="padding:24px 12px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:100%;background-color:${COLORS.paper};border:1px solid ${COLORS.line};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:${COLORS.ink};padding:30px 32px;">
              <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:${COLORS.orange};font-weight:800;">Sinlapa</div>
              <div style="font-size:27px;color:${COLORS.cream};font-weight:800;margin-top:10px;">Månadsrapport</div>
              <div style="font-size:14px;color:#c9beb2;margin-top:4px;">${escapeHtml(monthLabel)} · sinlapa.se</div>
            </td>
          </tr>
          ${banner}
          <tr><td style="padding:26px 32px 0;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.inkSoft};">
              Hej! Här är månadens sammanfattning av er webbplats – besökare, beställningar, bokningar och en rekommendation inför nästa månad.
            </p>
          </td></tr>
          ${stats}
          ${trafficSection}
          ${clicksSection}
          ${formsSection}
          ${healthSection}
          ${recommendationSection}
          ${noteSection}
          ${ctaSection}
          <tr>
            <td style="background-color:${COLORS.ink};padding:22px 32px;color:#c9beb2;font-size:13px;line-height:1.7;">
              <strong style="color:${COLORS.cream};">Sinlapa</strong> · Amiralsgatan 8K, Malmö<br />
              <a href="tel:+46760077599" style="color:${COLORS.orange};text-decoration:none;">0760-07 75 99</a> ·
              <a href="mailto:info@sinlapa.se" style="color:${COLORS.orange};text-decoration:none;">info@sinlapa.se</a> ·
              <a href="https://sinlapa.se" style="color:${COLORS.orange};text-decoration:none;">sinlapa.se</a>
            </td>
          </tr>
        </table>
        <div style="font-size:12px;color:${COLORS.muted};margin-top:14px;text-align:center;">
          ${footerLink ? `${escapeHtml(footerLink)}<br />` : ""}
          Rapporten skickas automatiskt den 1:a varje månad · Genererad ${escapeHtml(formatDateSv(data.generatedAt))}
        </div>
      </td></tr>
    </table>`;

  const html = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sinlapa månadsrapport ${escapeHtml(monthLabel)}</title>
${isPdf ? `<style>@page { size: A4; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } tr, td { page-break-inside: avoid; }</style>` : ""}
</head>
<body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:${FONT};">
${body}
</body>
</html>`;

  const text = [
    `SINLAPA – MÅNADSRAPPORT ${monthLabel.toUpperCase()}`,
    "",
    traffic.available
      ? `Besök: ${formatNumber(traffic.visits)} | Sidvisningar: ${formatNumber(traffic.pageViews)}`
      : "Trafikstatistik saknas.",
    `Foodora-klick: ${formatNumber(clicks.foodora)} | Wolt-klick: ${formatNumber(clicks.wolt)}`,
    `Bordsbokningar: ${formatNumber(forms.booking)} | Cateringförfrågningar: ${formatNumber(forms.catering)}`,
    "",
    `Rekommendation: ${data.recommendation || ""}`,
    data.note ? `Kommentar: ${data.note}` : "",
    webUrl ? `Rapporten online: ${webUrl}` : "",
    "",
    "Sinlapa · Amiralsgatan 8K, Malmö · 0760-07 75 99 · info@sinlapa.se"
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Sinlapa – månadsrapport ${monthLabel}`,
    html,
    body,
    text
  };
}
