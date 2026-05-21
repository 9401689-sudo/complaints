export function shorten(value, max) {
  const str = String(value || "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function formatUrlPreview(value, max = 88) {
  const url = String(value || "").trim();
  if (!url) return "—";

  try {
    const parsed = new URL(url);
    const compact = `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    return shorten(compact, max);
  } catch {
    return shorten(url, max);
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizeFilename(value, fallback = "download.bin") {
  const name = String(value || "").trim();
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+$/g, "");
  return cleaned || fallback;
}
