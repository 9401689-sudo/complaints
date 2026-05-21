export function getVisibilityLabel(visibility) {
  return visibility === "private" ? "Личное" : "Общее";
}

export function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 Б";
  }

  const units = ["Б", "КБ", "МБ", "ГБ"];
  let current = bytes;
  let index = 0;

  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }

  const digits = current >= 10 || index === 0 ? 0 : 1;
  return `${current.toFixed(digits)} ${units[index]}`;
}
