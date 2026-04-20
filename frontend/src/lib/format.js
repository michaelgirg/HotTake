export function titleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatRating(value) {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
}

export function formatStatus(value) {
  return titleCase(value);
}
