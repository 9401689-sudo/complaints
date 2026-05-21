export function isImageMime(mimeType) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff", "image/heic", "image/heif"].includes(mimeType || "");
}

export function isVideoMime(mimeType) {
  return ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/x-matroska"].includes(mimeType || "");
}

export function isPdfMime(mimeType) {
  return mimeType === "application/pdf";
}

export function guessMimeByFileName(fileName = "") {
  const ext = String(fileName).split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "bmp") return "image/bmp";
  if (["tif", "tiff"].includes(ext)) return "image/tiff";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  if (ext === "pdf") return "application/pdf";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "m4v") return "video/x-m4v";
  if (ext === "mkv") return "video/x-matroska";
  if (["mov", "qt"].includes(ext)) return "video/quicktime";
  return "";
}
