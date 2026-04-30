const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff", "image/heic", "image/heif"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/x-matroska"];

export function getPreviewUrl(caseId, fileId, token = "") {
  const path = window.location.pathname || "/";
  const [, prefix] = path.split("/");
  const appPrefix = prefix || "complaints";
  const encodedToken = encodeURIComponent(token || "");
  return `https://complaints-api.doorsvip.ru/${appPrefix}/api/cases/${caseId}/files/${fileId}/preview?token=${encodedToken}`;
}

export function isImageMime(mimeType) {
  return IMAGE_MIME_TYPES.includes(mimeType || "");
}

export function isVideoMime(mimeType) {
  return VIDEO_MIME_TYPES.includes(mimeType || "");
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

export function getPreviewMarkup(file, opts = {}, deps) {
  const {
    currentCaseId,
    token,
    escapeHtml
  } = deps;
  const src = getPreviewUrl(currentCaseId, file.id, token);
  const mimeType = file.mime_type || file.mimeType || guessMimeByFileName(file.file_name || file.fileName || "");
  const title = file.file_name || file.fileName || "preview";
  const previewAttr = opts.attrName || "data-preview-file-id";
  const clickable = opts.clickable !== false;
  const wrapperAttr = clickable ? `${previewAttr}="${file.id}"` : "";

  if (isImageMime(mimeType)) {
    return `<button class="preview-button" type="button" ${wrapperAttr}><img class="image-thumb" src="${src}" alt="${escapeHtml(title)}" /></button>`;
  }

  if (isVideoMime(mimeType)) {
    return `
      <button class="preview-button" type="button" ${wrapperAttr}>
        <video class="media-thumb" src="${src}" muted preload="metadata" playsinline></video>
        <span class="thumb-badge">Видео</span>
      </button>
    `;
  }

  if (isPdfMime(mimeType)) {
    return `
      <button class="preview-button" type="button" ${wrapperAttr}>
        <iframe class="pdf-thumb" src="${src}#toolbar=0&navpanes=0&scrollbar=0" title="${escapeHtml(title)}"></iframe>
        <span class="thumb-badge">PDF</span>
      </button>
    `;
  }

  return `
    <button class="preview-button" type="button" ${wrapperAttr}>
      <span class="file-thumb media-tile">${escapeHtml((mimeType || "FILE").toUpperCase())}</span>
    </button>
  `;
}

export function formatUrlPreview(value, max = 88) {
  const text = String(value || "").trim();
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
