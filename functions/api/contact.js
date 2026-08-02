import { json } from "../lib/config.js";
import { sendNotificationEmail } from "../lib/email.js";

function clean(value) {
  return String(value ?? "").trim().slice(0, 2000);
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const type = body?.type === "booking" ? "booking" : body?.type === "catering" ? "catering" : null;
  if (!type) {
    return json({ error: "Unknown form type" }, 400);
  }

  if (type === "booking") {
    const name = clean(body.name);
    const phone = clean(body.phone);
    const email = clean(body.email);
    const party = clean(body.party);
    const date = clean(body.date);
    const time = clean(body.time);
    const message = clean(body.message);

    if (!name || !phone || !email || !party || !date || !time) {
      return json({ error: "Fyll i alla obligatoriska fält." }, 400);
    }

    const result = await sendNotificationEmail(context.env, {
      type: "booking",
      replyTo: email,
      fields: {
        Namn: name,
        Telefon: phone,
        Epost: email,
        "Antal personer": party,
        Datum: date,
        Tid: time,
        Onskemal: message || "—"
      }
    });

    if (!result.ok) {
      return json({ error: result.error || "Kunde inte skicka bokningen." }, 502);
    }

    return json({
      ok: true,
      mocked: Boolean(result.mocked),
      message: "Tack! Vi återkommer med bekräftelse så snart vi kan."
    });
  }

  const name = clean(body.name);
  const email = clean(body.email);
  const date = clean(body.date);
  const guests = clean(body.guests);
  const event = clean(body.event);
  const message = clean(body.message);

  if (!name || !email || !date || !guests || !event) {
    return json({ error: "Fyll i alla obligatoriska fält." }, 400);
  }

  const result = await sendNotificationEmail(context.env, {
    type: "catering",
    replyTo: email,
    fields: {
      Namn: name,
      Epost: email,
      Datum: date,
      "Antal gaster": guests,
      "Typ av event": event,
      Onskemal: message || "—"
    }
  });

  if (!result.ok) {
    return json({ error: result.error || "Kunde inte skicka förfrågan." }, 502);
  }

  return json({
    ok: true,
    mocked: Boolean(result.mocked),
    message: "Tack! Vi återkommer med förslag och pris."
  });
}
