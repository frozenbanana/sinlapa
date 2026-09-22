import { periodLabel } from "./time.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const PAGE_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #17120f; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4ecdf; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 28px 16px 64px; }
  .brand { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: #f06b25; font-weight: 800; }
  h1 { font-size: 24px; margin: 10px 0 4px; }
  .sub { color: #c9beb2; font-size: 14px; margin: 0 0 20px; }
  .notice { border-radius: 12px; padding: 14px 16px; font-size: 14px; line-height: 1.55; margin-bottom: 16px; }
  .notice.info { background: #2a211c; border: 1px solid #4a3b31; }
  .notice.error { background: #3a1d17; border: 1px solid #b3402e; color: #ffd9cf; }
  iframe { width: 100%; height: 920px; border: 1px solid #4a3b31; border-radius: 14px; background: #f4ecdf; display: block; }
  form { margin-top: 22px; background: #221b17; border: 1px solid #4a3b31; border-radius: 14px; padding: 18px; }
  label { display: block; font-size: 13px; font-weight: 700; color: #f4ecdf; margin-bottom: 14px; }
  small { display: block; font-weight: 400; color: #a99d92; margin: 4px 0 8px; }
  textarea { width: 100%; border-radius: 10px; border: 1px solid #5a4a3e; background: #17120f; color: #f4ecdf; padding: 12px; font-size: 14px; line-height: 1.5; font-family: inherit; resize: vertical; }
  textarea:focus { outline: 2px solid #f06b25; border-color: #f06b25; }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  button { font-size: 14px; font-weight: 700; border-radius: 999px; padding: 12px 22px; border: 1px solid transparent; cursor: pointer; font-family: inherit; }
  .primary { background: #f06b25; color: #17120f; }
  .primary:hover { background: #d94e0e; }
  .ghost { background: transparent; color: #f4ecdf; border-color: #5a4a3e; }
  .ghost:hover { border-color: #b3402e; color: #ffd9cf; }
  .foot { margin-top: 18px; font-size: 12px; color: #a99d92; line-height: 1.6; }
  .card { background: #fbf7f0; color: #2a211c; border-radius: 16px; padding: 32px; max-width: 560px; margin: 60px auto; }
  .card h1 { color: #17120f; font-size: 22px; margin-top: 0; }
  .card p { line-height: 1.6; }
  a.button { display: inline-block; background: #f06b25; color: #17120f; text-decoration: none; font-weight: 700; border-radius: 999px; padding: 12px 22px; margin-top: 8px; }
`;

export function renderReviewPage(data, token, error = "") {
  const monthLabel = periodLabel(data.period);
  const errorHtml = error
    ? `<div class="notice error"><strong>Det gick inte att slutföra:</strong> ${escapeHtml(error)}</div>`
    : "";
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Granska månadsrapport – ${escapeHtml(monthLabel)}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">Sinlapa</div>
    <h1>Granska månadsrapport – ${escapeHtml(monthLabel)}</h1>
    <p class="sub">Inget har skickats till Sinlapa ännu. Ändra rekommendationen eller lägg till en kommentar, och godkänn sedan.</p>
    ${errorHtml}
    <div class="notice info">Utkastet skickas till <strong>info@sinlapa.se</strong> med dig på BCC, som HTML-mail med PDF bifogad och en länk till webbversionen.</div>
    <iframe src="/r/${escapeHtml(token)}/preview" title="Förhandsvisning av rapporten" loading="lazy"></iframe>
    <form method="post" action="/r/${escapeHtml(token)}">
      <label>
        Rekommendation
        <small>Visas i rapportens rekommendationsruta. Lämna tomt för att ta bort den.</small>
        <textarea name="recommendation" rows="4" maxlength="1200">${escapeHtml(data.recommendation || "")}</textarea>
      </label>
      <label>
        Personlig kommentar (valfri)
        <small>Visas i en egen ruta i rapporten, t.ex. en hälsning till ägaren.</small>
        <textarea name="note" rows="3" maxlength="800">${escapeHtml(data.note || "")}</textarea>
      </label>
      <div class="actions">
        <button class="primary" type="submit" name="action" value="approve">Godkänn och skicka</button>
        <button class="ghost" type="submit" name="action" value="skip" onclick="return confirm('Hoppa över rapporten för denna månad? Inget skickas till Sinlapa.');">Hoppa över denna månad</button>
      </div>
      <p class="foot">Efter godkännande skapas PDF:en och mailet skickas direkt. Denna sida kan bara användas en gång.</p>
    </form>
  </div>
</body>
</html>`;
}

export function renderResultPage({ title, message, tone = "ok" }) {
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>${escapeHtml(title)}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
  <div class="card">
    <div class="brand">Sinlapa</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
