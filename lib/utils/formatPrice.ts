export function formatPrice(value: unknown): string {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

export function safePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
