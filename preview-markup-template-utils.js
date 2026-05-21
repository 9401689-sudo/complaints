export function buildPreviewMarkupByKind({
  previewKind,
  src,
  wrapperAttr,
  escapedTitle,
  badgeText,
  pdfFrameSrc,
  fallbackTileText
}) {
  if (previewKind === "image") {
    return `<button class="preview-button" type="button" ${wrapperAttr}><img class="image-thumb" src="${src}" alt="${escapedTitle}" /></button>`;
  }

  if (previewKind === "video") {
    return `
      <button class="preview-button" type="button" ${wrapperAttr}>
        <video class="media-thumb" src="${src}" muted preload="metadata" playsinline></video>
        <span class="thumb-badge">${badgeText}</span>
      </button>
    `;
  }

  if (previewKind === "pdf") {
    return `
      <button class="preview-button" type="button" ${wrapperAttr}>
        <iframe class="pdf-thumb" src="${pdfFrameSrc}" title="${escapedTitle}"></iframe>
        <span class="thumb-badge">${badgeText}</span>
      </button>
    `;
  }

  return `
    <button class="preview-button" type="button" ${wrapperAttr}>
      <span class="file-thumb media-tile">${fallbackTileText}</span>
    </button>
  `;
}
