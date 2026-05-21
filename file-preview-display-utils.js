import {
  guessMimeByFileName,
  isImageMime,
  isPdfMime,
  isVideoMime
} from "./mime-preview-lookup-utils.js";

export function getPreviewFileMeta(file = {}) {
  const mimeType = file.mime_type || file.mimeType || guessMimeByFileName(file.file_name || file.fileName || "");
  const title = file.file_name || file.fileName || "preview";
  return { mimeType, title };
}

export function getPreviewDisplayKind(mimeType) {
  if (isImageMime(mimeType)) return "image";
  if (isVideoMime(mimeType)) return "video";
  if (isPdfMime(mimeType)) return "pdf";
  return "file";
}

export function getPreviewWrapperAttr(fileId, opts = {}) {
  const previewAttr = opts.attrName || "data-preview-file-id";
  const clickable = opts.clickable !== false;
  return clickable ? `${previewAttr}="${fileId}"` : "";
}
