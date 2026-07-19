/**
 * Extracts the numeric portion of a weight input, discarding units like "g"
 * that the user may have pasted in. Returns an empty string when nothing
 * numeric can be found.
 */
export function normalizeWeight(rawValue: string): string {
  if (!rawValue) return "";

  const withDot = rawValue.trim().replace(",", ".");
  const match = withDot.match(/\d+(?:\.\d+)?/);
  if (!match) return "";

  const [numeric] = match;
  if (!numeric.includes(".")) return numeric.replace(/^0+(?=\d)/, "");

  const trimmed = numeric.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed.replace(/^0+(?=\d)/, "");
}

/** Formats a normalized weight value for display/export, e.g. "690" -> "690g". */
export function formatWeightLabel(weight: string): string {
  const normalized = normalizeWeight(weight);
  return normalized ? `${normalized}g` : "";
}
