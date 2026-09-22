import { renderReport } from "./report.js";
import { periodLabel } from "./time.js";

function toBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export async function sendEmail(env, { to, bcc, from, subject, html, text, attachments, replyTo }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: from || env.FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      reply_to: replyTo || undefined,
      subject,
      html,
      text,
      attachments
    })
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend ${response.status}: ${details.slice(0, 300)}`);
  }
  return response.json().catch(() => ({}));
}

function draftBanner() {
  return `
    <tr><td style="padding:24px 32px 0;">
      <div style="background-color:#fff4e8;border:1px solid #f6c9a8;border-radius:12px;padding:14px 18px;font-size:14px;line-height:1.6;">
        <strong style="color:#b3402e;">Utkast – inget har skickats till Sinlapa ännu.</strong><br />
        <span style="color:#2a211c;">Granska rapporten, ändra eller ta bort rekommendationen och godkänn sedan via knappen nedan.</span>
      </div>
    </td></tr>`;
}

export async function sendReviewEmail(env, data, reviewUrl) {
  const report = renderReport(data, {
    mode: "email",
    webUrl: reviewUrl,
    ctaLabel: "Granska och godkänn",
    banner: draftBanner()
  });
  await sendEmail(env, {
    to: env.REVIEW_EMAIL,
    subject: `[Granska] ${report.subject}`,
    html: report.html,
    text: `${report.text}\n\nGranska och godkänn: ${reviewUrl}`
  });
  return report;
}

export async function sendReminderEmail(env, data, reviewUrl) {
  const monthLabel = periodLabel(data.period);
  const html = `<!doctype html><html lang="sv"><body style="margin:0;padding:0;background:#f4ecdf;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%"><tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="560" style="width:560px;max-width:100%;background:#fbf7f0;border:1px solid #e6dccb;border-radius:16px;">
        <tr><td style="background:#17120f;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#f06b25;font-weight:800;">Sinlapa</div>
          <div style="font-size:22px;color:#f4ecdf;font-weight:800;margin-top:8px;">Påminnelse: månadsrapporten väntar</div>
        </td></tr>
        <tr><td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#2a211c;">
          <p style="margin:0 0 16px;">Rapporten för <strong>${monthLabel}</strong> är fortfarande ett utkast och har inte skickats till Sinlapa.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f06b25;border-radius:999px;">
            <a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#17120f;text-decoration:none;">Granska och godkänn</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  await sendEmail(env, {
    to: env.REVIEW_EMAIL,
    subject: `Påminnelse: månadsrapporten för ${monthLabel} väntar på godkännande`,
    html,
    text: `Rapporten för ${monthLabel} väntar på godkännande: ${reviewUrl}`
  });
}

export async function sendCustomerEmail(env, data, { webUrl, pdfBytes }) {
  const report = renderReport(data, { mode: "email", webUrl, ctaLabel: "Se rapporten online" });
  const attachments = pdfBytes
    ? [
        {
          filename: `sinlapa-manadsrapport-${data.period}.pdf`,
          content: toBase64(pdfBytes)
        }
      ]
    : undefined;
  await sendEmail(env, {
    to: env.NOTIFY_EMAIL,
    bcc: env.REVIEW_EMAIL,
    subject: report.subject,
    html: report.html,
    text: report.text,
    attachments
  });
  return report;
}

export async function sendConfirmationEmail(env, data, { webUrl }) {
  const monthLabel = periodLabel(data.period);
  const html = `<!doctype html><html lang="sv"><body style="margin:0;padding:0;background:#f4ecdf;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%"><tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="560" style="width:560px;max-width:100%;background:#fbf7f0;border:1px solid #e6dccb;border-radius:16px;">
        <tr><td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#2a211c;">
          <p style="margin:0 0 12px;"><strong>Rapporten för ${monthLabel} är skickad</strong> till info@sinlapa.se (med dig på BCC).</p>
          <p style="margin:0;">Webbversion: <a href="${webUrl}" style="color:#d94e0e;">${webUrl}</a></p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  await sendEmail(env, {
    to: env.REVIEW_EMAIL,
    subject: `Skickad: månadsrapport ${monthLabel}`,
    html,
    text: `Rapporten för ${monthLabel} är skickad till info@sinlapa.se.\nWebbversion: ${webUrl}`
  });
}

export async function sendFailureEmail(env, period, error) {
  const monthLabel = periodLabel(period);
  await sendEmail(env, {
    to: env.REVIEW_EMAIL,
    subject: `Problem: månadsrapporten för ${monthLabel} kunde inte skapas`,
    html: `<p>Rapporten för <strong>${monthLabel}</strong> kunde inte skapas och har därför inte skickats.</p><p>Fel: <code>${String(error).replaceAll("<", "&lt;")}</code></p><p>Jag försöker igen automatiskt imorgon.</p>`,
    text: `Rapporten för ${monthLabel} kunde inte skapas.\nFel: ${error}\nEtt nytt försök görs automatiskt imorgon.`
  });
}
