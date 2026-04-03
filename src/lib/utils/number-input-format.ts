const integerFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatIntegerInput(value: string): string {
  const digits = sanitizeDigits(value);

  if (!digits) {
    return "";
  }

  return integerFormatter.format(Number(digits));
}

export function parseIntegerInput(value: string): number {
  const digits = sanitizeDigits(value);

  if (!digits) {
    return 0;
  }

  return Number(digits);
}

export function sanitizeDecimalInput(value: string, maxDecimals = 2): string {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const firstDot = normalized.indexOf(".");

  if (firstDot === -1) {
    return normalized;
  }

  const integerPart = normalized.slice(0, firstDot + 1);
  const decimalPart = normalized
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, maxDecimals);

  return `${integerPart}${decimalPart}`;
}

export function parseDecimalInput(value: string): number {
  if (!value || value === ".") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDueDayInput(value: string): number | null {
  const day = parseIntegerInput(value);

  if (!day) {
    return null;
  }

  if (day < 1) {
    return 1;
  }

  if (day > 31) {
    return 31;
  }

  return day;
}
