/**
 * Canonical internal quantity format: bare number means grams for historical
 * compatibility; kg, ml and L are explicitly retained. Dot is the stored
 * decimal separator, comma the displayed Brazilian decimal separator.
 */
export function normalizeWeight(rawValue: string): string {
  if (!rawValue) return "";
  const compact = rawValue.trim().replace(/\s+/g, "").replace(",", ".");
  const match = compact.match(/^(\d+(?:\.\d+)?)(kg|ml|g|l)?$/i);
  if (!match) return "";

  const value = match[1]
    .replace(/^0+(?=\d)/, "")
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  const unit = match[2]?.toLowerCase();
  return `${value}${!unit || unit === "g" ? "" : unit === "l" ? "L" : unit}`;
}

/** For legacy numbers append g, while respecting explicitly-entered units. */
export function formatWeightLabel(rawValue: string): string {
  const normalized = normalizeWeight(rawValue);
  if (!normalized) return "";
  const match = normalized.match(/^(\d+(?:\.\d+)?)(kg|ml|L)?$/);
  if (!match) return "";
  return `${match[1].replace(".", ",")}${match[2] || "g"}`;
}

/** Format thousands without confusing a decimal fraction with a grouping. */
export function formatWeightForDisplay(weightLabel: string): string {
  const match = weightLabel.match(/^(\d+)(g|kg|ml|L)$/);
  if (!match) return weightLabel;
  return `${match[1].replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${match[2]}`;
}
