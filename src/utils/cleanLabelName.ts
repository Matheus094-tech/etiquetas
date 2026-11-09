/**
 * Some pasted names contain a lone typographic closing quote at the end
 * (e.g. FRANGO’). It is not produced by the SVG renderer. Remove only that
 * unmatched trailing quote; internal and ASCII apostrophes remain intact.
 */
export function cleanLabelName(name: string): string {
  const trimmed = name.trim();
  if (/\p{L}\u2019$/u.test(trimmed) && !trimmed.includes("\u2018")) {
    return trimmed.slice(0, -1).trimEnd();
  }
  return trimmed;
}
