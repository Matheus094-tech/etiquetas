import type { LabelData } from "../label/label.types";
import { formatWeightLabel } from "./normalizeWeight";
import { slugify } from "./text";

export type ExportExtension = "png" | "svg";

/**
 * Builds a filesystem-safe filename from the current label data, e.g.
 * "etiqueta-patinho-moido-690g.png".
 */
export function createFilename(
  data: LabelData,
  extension: ExportExtension
): string {
  const parts = [data.name, data.description, formatWeightLabel(data.weight)]
    .map(slugify)
    .filter((part) => part.length > 0);

  const base = parts.length > 0 ? `etiqueta-${parts.join("-")}` : "etiqueta";
  return `${base}.${extension}`;
}
