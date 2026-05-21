export function getPreviewBadgeText(previewKind) {
  if (previewKind === "video") return "Видео";
  if (previewKind === "pdf") return "PDF";
  return "";
}

export function getPdfPreviewFrameSrc(src) {
  return `${src}#toolbar=0&navpanes=0&scrollbar=0`;
}

export function getPreviewFallbackTileText(mimeType) {
  return (mimeType || "FILE").toUpperCase();
}
