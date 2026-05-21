export function formatDateForInput(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

export function maskDateInputValue(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const parts = [];

  if (digits.length > 0) {
    parts.push(digits.slice(0, 2));
  }
  if (digits.length > 2) {
    parts.push(digits.slice(2, 4));
  }
  if (digits.length > 4) {
    parts.push(digits.slice(4, 8));
  }

  return parts.join(".");
}

export function normalizeDisplayDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}.${month}.${year}`;
  }

  return maskDateInputValue(raw);
}

export function parseStrictDisplayDate(value, fieldLabel) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    throw new Error(`${fieldLabel}: используйте формат дд.мм.гггг`);
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const currentYear = new Date().getFullYear();

  if (day < 1 || day > 31) {
    throw new Error(`${fieldLabel}: день должен быть в диапазоне 01-31`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`${fieldLabel}: месяц должен быть в диапазоне 01-12`);
  }

  if (year < 2000 || year > currentYear) {
    throw new Error(`${fieldLabel}: год должен быть в диапазоне 2000-${currentYear}`);
  }

  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) {
    throw new Error(`${fieldLabel}: такой даты не существует`);
  }

  return `${dayText}.${monthText}.${yearText}`;
}

export function formatComplaintDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const displayMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (displayMatch) {
    const [, day, month, year] = displayMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date) + " г.";
    }
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return raw;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date) + " г.";
}

export function collapseDuplicateDateSuffixes(text) {
  return String(text || "").replace(
    /(\d{1,2}\s+[А-Яа-яЁё]+\s+\d{4})\s*г\.\s*г\./g,
    "$1 г."
  );
}

