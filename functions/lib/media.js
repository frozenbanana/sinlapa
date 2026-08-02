export const MEDIA_PREFIX = "gallery/";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const SITE_GALLERY = [
  { key: "site:menu-5", url: "/assets/menu-5.webp", name: "Yum bowl", source: "site" },
  { key: "site:menu-6", url: "/assets/menu-6.webp", name: "Sharing plate", source: "site" },
  { key: "site:menu-7", url: "/assets/menu-7.webp", name: "Po Pia Tod", source: "site" },
  { key: "site:menu-8", url: "/assets/menu-8.webp", name: "Thai iced tea", source: "site" },
  { key: "site:menu-9", url: "/assets/menu-9.webp", name: "Mango sticky rice", source: "site" },
  { key: "site:menu-10", url: "/assets/menu-10.webp", name: "Crispy chicken bowl", source: "site" },
  { key: "site:dish-1", url: "/assets/dish-1.webp", name: "Dish 1", source: "site" },
  { key: "site:dish-2", url: "/assets/dish-2.webp", name: "Dish 2", source: "site" },
  { key: "site:dish-3", url: "/assets/dish-3.webp", name: "Dish 3", source: "site" },
  { key: "site:dish-4", url: "/assets/dish-4.webp", name: "Dish 4", source: "site" }
];

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);

export function mediaUrl(key) {
  return `/media/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
}

export function extensionForType(type) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

export function assertImageFile(file) {
  if (!file || typeof file !== "object") {
    return "Ingen bild vald.";
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Endast JPG, PNG, WebP, GIF eller AVIF stöds.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Bilden får max vara 5 MB.";
  }
  return null;
}

export async function listUploadedMedia(env) {
  if (!env.MEDIA) return [];

  const listed = await env.MEDIA.list({ prefix: MEDIA_PREFIX });
  return (listed.objects || []).map((object) => ({
    key: object.key,
    url: mediaUrl(object.key),
    name: object.key.replace(MEDIA_PREFIX, ""),
    source: "r2",
    uploaded: object.uploaded?.toISOString?.() || null,
    size: object.size
  }));
}

export async function listGallery(env) {
  const uploaded = await listUploadedMedia(env);
  return [...uploaded, ...SITE_GALLERY];
}
