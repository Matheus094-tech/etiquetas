import { fitText, type FitTextResult } from "../utils/fitText";

/** Single source of truth for the 40 x 12 mm label's physical composition. */
export const LABEL_DIMENSIONS = {
  widthMm: 40,
  heightMm: 12,
  viewBoxWidth: 2000,
  viewBoxHeight: 600,
} as const;

export const LABEL_TEXT_ZONE = {
  left: 500,
  right: 1440,
  center: 970,
} as const;

const FONT = 'Georgia, "Times New Roman", serif';
export const LABEL_FONT = FONT;

export interface LabelTextLayout {
  name: FitTextResult;
  nameY: number[];
  quantityFontSize: number;
  quantityY: number;
  descriptionFontSize: number;
  descriptionY: number;
}

/**
 * All font sizes and positions are in physical SVG viewBox units, not CSS px.
 * The same immutable SVG is previewed and exported to each thermal DPI.
 */
export function layoutLabelText(
  name: string,
  quantity: string,
  description: string
): LabelTextLayout {
  const width = LABEL_TEXT_ZONE.right - LABEL_TEXT_ZONE.left;
  const nameLayout = fitText(name || "NOME DO ALIMENTO", {
    maxWidth: width,
    maxFontSize: 168,
    minFontSize: 58,
    maxTwoLineFontSize: 109,
    fontFamily: FONT,
    fontWeight: 700,
  });
  const multiline = nameLayout.lines.length === 2;
  const desiredQuantityFont = Math.min(140, nameLayout.fontSize * 0.82);
  const quantityLayout = fitText(quantity || "PESO", {
    maxWidth: width - 40,
    maxFontSize: desiredQuantityFont,
    minFontSize: 36,
    fontFamily: FONT,
    fontWeight: 700,
    allowWrap: false,
  });
  const descLayout = fitText(description, {
    maxWidth: width - 40,
    maxFontSize: multiline ? 32 : 47,
    minFontSize: 22,
    fontFamily: FONT,
    fontWeight: 700,
    allowWrap: false,
  });
  return {
    name: nameLayout,
    nameY: multiline ? [179, 290] : [220],
    quantityFontSize: quantityLayout.fontSize,
    quantityY: multiline ? 392 : 378,
    descriptionFontSize: descLayout.fontSize,
    descriptionY: multiline ? 464 : 463,
  };
}
