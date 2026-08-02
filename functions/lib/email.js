function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildEmail({ type, fields }) {
  const title = type === "booking" ? "Ny bordsbokning från sinlapa.se" : "Ny cateringförfrågan från sinlapa.se";
  const rows = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;"><strong>${escapeHtml(key)}</strong></td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`)
    .join("");

  const text = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return {
    subject: title,
    text: `${title}\n\n${text}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#17120f;"><h2 style="margin:0 0 12px;">${escapeHtml(title)}</h2><table>${rows}</table></div>`
  };
}

export async function sendNotificationEmail(env, { type, fields, replyTo }) {
  const to = env.NOTIFY_EMAIL;
  if (!to) {
    return { ok: false, error: "NOTIFY_EMAIL is not configured" };
  }

  const { subject, text, html } = buildEmail({ type, fields });
  const from = env.FROM_EMAIL || "Sinlapa Webb <onboarding@resend.dev>";

  if (!env.RESEND_API_KEY) {
    console.log("[email:dev-fallback]", { to, subject, text, replyTo });
    return {
      ok: true,
      mocked: true,
      message: "Email logged locally because RESEND_API_KEY is missing"
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo || undefined,
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[email:resend-error]", details);
    return { ok: false, error: "Failed to send email" };
  }

  return { ok: true, mocked: false };
}
