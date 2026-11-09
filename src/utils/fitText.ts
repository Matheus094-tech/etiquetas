export interface FitTextOptions {
  /** Maximum width in SVG viewBox user units (independent of screen pixels). */
  maxWidth: number;
  maxFontSize: number;
  /** Preferred minimum; text can be smaller if necessary to prevent clipping. */
  minFontSize: number;
  fontFamily: string;
  fontWeight?: string | number;
  step?: number;
  /** Cap two-line text independently of a one-line title's height budget. */
  maxTwoLineFontSize?: number;
  allowWrap?: boolean;
}

export interface FitTextResult {
  lines: [string] | [string, string];
  fontSize: number;
}

let measurementContext: CanvasRenderingContext2D | null | undefined;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (measurementContext !== undefined) return measurementContext;
  if (typeof document === "undefined") return null;
  try {
    measurementContext = document.createElement("canvas").getContext("2d");
  } catch {
    measurementContext = null;
  }
  return measurementContext;
}

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
  // Conservative approximation for jsdom/offline environments.
  return Array.from(text).length * fontSize * 0.64;
}

function splitIntoTwoLines(text: string): [string, string] | null {
  const segments = text.includes(" ")
    ? text.split(/\s+/)
    : text.includes("/")
      ? text.split(/(?<=\/)/)
      : [];
  if (segments.length < 2) return null;

  let best: [string, string] | null = null;
  let bestDifference = Infinity;
  for (let i = 1; i < segments.length; i += 1) {
    const left = segments.slice(0, i).join(" ").trim();
    const right = segments.slice(i).join(" ").trim();
    if (!left || !right) continue;
    const difference = Math.abs(left.length - right.length);
    if (difference < bestDifference) {
      best = [left, right];
      bestDifference = difference;
    }
  }
  return best;
}

function largestFittingFont(
  lines: string[],
  max: number,
  options: FitTextOptions
): number {
  const { maxWidth, fontFamily, fontWeight = 700, step = 2 } = options;
  for (let size = max; size >= 1; size -= Math.max(1, step)) {
    if (lines.every((line) => measureTextWidth(line, size, fontFamily, fontWeight) <= maxWidth)) {
      return size;
    }
  }
  return 1;
}

/** Width-safe name fitting; wrapping only when it improves physical legibility. */
export function fitText(rawText: string, options: FitTextOptions): FitTextResult {
  const text = rawText.trim();
  if (!text) return { lines: [""], fontSize: options.maxFontSize };

  const oneLineFont = largestFittingFont([text], options.maxFontSize, options);
  if (options.allowWrap === false) {
    return { lines: [text], fontSize: oneLineFont };
  }

  const split = splitIntoTwoLines(text);
  if (split) {
    const twoLineFont = largestFittingFont(
      split,
      Math.min(options.maxFontSize, options.maxTwoLineFontSize ?? options.maxFontSize),
      options
    );
    // A second line costs vertical space; require a meaningful size gain.
    if (twoLineFont >= oneLineFont * 1.12 && twoLineFont >= options.minFontSize) {
      return { lines: split, fontSize: twoLineFont };
    }
  }

  return { lines: [text], fontSize: oneLineFont };
}
