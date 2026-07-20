export interface FitTextOptions {
  /** Maximum width, in the same user units as the SVG viewBox, a line may occupy. */
  maxWidth: number;
  maxFontSize: number;
  minFontSize: number;
  fontFamily: string;
  fontWeight?: string | number;
  /** Font size step used while searching for the best fit. */
  step?: number;
}

export interface FitTextResult {
  lines: [string] | [string, string];
  fontSize: number;
}

let measurementContext: CanvasRenderingContext2D | null | undefined;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (measurementContext !== undefined) return measurementContext;
  if (typeof document === "undefined") {
    measurementContext = null;
    return measurementContext;
  }
  try {
    const canvas = document.createElement("canvas");
    measurementContext = canvas.getContext("2d");
  } catch {
    measurementContext = null;
  }
  return measurementContext;
}

/**
 * Measures text width. Falls back to a heuristic average glyph width when a
 * 2D canvas context isn't available (e.g. jsdom in unit tests), keeping the
 * fitting algorithm deterministic and testable outside a real browser.
 */
function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string | number
): number {
  const ctx = getMeasurementContext();
  if (ctx) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
  }
  const AVERAGE_GLYPH_WIDTH_RATIO = 0.62;
  return text.length * fontSize * AVERAGE_GLYPH_WIDTH_RATIO;
}

function splitIntoTwoLines(text: string): [string, string] | null {
  if (text.includes(" ")) {
    const words = text.split(" ");
    if (words.length > 1) {
      let bestIndex = 1;
      let bestDiff = Infinity;
      for (let i = 1; i < words.length; i += 1) {
        const left = words.slice(0, i).join(" ");
        const right = words.slice(i).join(" ");
        const diff = Math.abs(left.length - right.length);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = i;
        }
      }
      return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
    }
  }

  if (text.includes("/")) {
    const index = text.indexOf("/");
    return [text.slice(0, index + 1), text.slice(index + 1)];
  }

  return null;
}

/**
 * Finds the largest font size (in one or two lines) that keeps `rawText`
 * within `maxWidth`, considering the available space rather than raw
 * character count.
 */
export function fitText(rawText: string, options: FitTextOptions): FitTextResult {
  const text = rawText.trim();
  const { maxWidth, maxFontSize, minFontSize, fontFamily, fontWeight = 700, step = 2 } = options;

  if (!text) {
    return { lines: [""], fontSize: maxFontSize };
  }

  for (let size = maxFontSize; size >= minFontSize; size -= step) {
    if (measureTextWidth(text, size, fontFamily, fontWeight) <= maxWidth) {
      return { lines: [text], fontSize: size };
    }
  }

  const split = splitIntoTwoLines(text);
  if (split) {
    for (let size = maxFontSize; size >= minFontSize; size -= step) {
      const fitsBoth =
        measureTextWidth(split[0], size, fontFamily, fontWeight) <= maxWidth &&
        measureTextWidth(split[1], size, fontFamily, fontWeight) <= maxWidth;
      if (fitsBoth) {
        return { lines: split, fontSize: size };
      }
    }
    return { lines: split, fontSize: minFontSize };
  }

  return { lines: [text], fontSize: minFontSize };
}
