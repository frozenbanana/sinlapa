import { isAuthorized, unauthorized } from "../../lib/auth.js";
import { json } from "../../lib/config.js";
import {
  MEDIA_PREFIX,
  assertImageFile,
  extensionForType,
  listGallery,
  mediaUrl
} from "../../lib/media.js";

export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  const images = await listGallery(context.env);
  return json({ images });
}

export async function onRequestPost(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  if (!context.env.MEDIA) {
    return json({ error: "MEDIA R2 binding is missing" }, 500);
  }

  let form;
  try {
    form = await context.request.formData();
  } catch {
    return json({ error: "Kunde inte läsa uppladdningen." }, 400);
  }

  const file = form.get("file");
  const error = assertImageFile(file);
  if (error) {
    return json({ error }, 400);
  }

  const ext = extensionForType(file.type);
  const safeName = String(file.name || "bild")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const key = `${MEDIA_PREFIX}${Date.now()}-${safeName || "bild"}.${ext}`;

  await context.env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable"
    },
    customMetadata: {
      originalName: String(file.name || "bild").slice(0, 120)
    }
  });

  return json({
    ok: true,
    image: {
      key,
      url: mediaUrl(key),
      name: key.replace(MEDIA_PREFIX, ""),
      source: "r2"
    }
  });
}

export async function onRequestDelete(context) {
  if (!isAuthorized(context.request, context.env)) {
    return unauthorized();
  }

  if (!context.env.MEDIA) {
    return json({ error: "MEDIA R2 binding is missing" }, 500);
  }

  const url = new URL(context.request.url);
  const key = url.searchParams.get("key") || "";
  if (!key.startsWith(MEDIA_PREFIX)) {
    return json({ error: "Kan bara ta bort uppladdade bilder." }, 400);
  }

  await context.env.MEDIA.delete(key);
  return json({ ok: true });
}
