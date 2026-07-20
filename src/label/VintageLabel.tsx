import { forwardRef, useMemo } from "react";
import { ILLUSTRATION_ASSET_URLS, LOGO_URL, TEMPLATE_BASE_URL, TEMPLATE_OVERLAY_URL } from "./assets";
import type { IllustrationKey } from "./label.types";
import { fitText } from "../utils/fitText";
import { formatWeightForDisplay, formatWeightLabel } from "../utils/normalizeWeight";
import { selectIllustration } from "../utils/selectIllustration";

export interface VintageLabelProps {
  name: string;
  description: string;
  weight: string;
  illustration: IllustrationKey;
  className?: string;
}

/** Official M&S label size: 40mm x 12mm (10:3 physical ratio). */
const WIDTH_MM = 40;
const HEIGHT_MM = 12;
const VIEWBOX_WIDTH = 2000;
const VIEWBOX_HEIGHT = 600;
const INK = "#1a1a1a";
const SERIF_FONT = 'Georgia, "Times New Roman", serif';

/** Positions from the approved asset pack's composition guide, inside the 2000x600 viewBox. */
const LOGO_BOX = { x: 100, y: 130, width: 350, height: 340 };
const ILLUSTRATION_BOX = { x: 1510, y: 105, width: 380, height: 390 };
const TEXT_ZONE = { x1: 470, x2: 1470, centerX: 970 };

const NAME_CENTER_Y = 250;
const DESCRIPTION_Y = 392;

const NAME_PLACEHOLDER = "NOME DO ALIMENTO";
const WEIGHT_PLACEHOLDER = "PESO";

/**
 * Composes the official M&S label from the approved static assets — the
 * base template, the logo, an illustration and the frame overlay — plus the
 * user's text. No artwork is redrawn here: the template, logo and
 * illustrations are the exact PNG files from the approved asset pack,
 * rendered as `<image>` layers. The same tree powers the live preview and
 * both export formats.
 */
export const VintageLabel = forwardRef<SVGSVGElement, VintageLabelProps>(function VintageLabel(
  { name, description, weight, illustration, className },
  ref
) {
  const trimmedName = name.trim();
  const displayName = trimmedName ? trimmedName.toUpperCase() : "";
  const weightLabel = formatWeightLabel(weight);
  const resolvedIllustration = useMemo(
    () => selectIllustration(name, description, illustration),
    [name, description, illustration]
  );
  const illustrationUrl =
    resolvedIllustration === "none" ? null : ILLUSTRATION_ASSET_URLS[resolvedIllustration];

  const { lines: nameLines, fontSize: nameFontSize } = useMemo(
    () =>
      fitText(displayName || NAME_PLACEHOLDER, {
        maxWidth: TEXT_ZONE.x2 - TEXT_ZONE.x1 - 40,
        maxFontSize: 180,
        minFontSize: 50,
        fontFamily: SERIF_FONT,
        fontWeight: 700,
      }),
    [displayName]
  );

  const descriptionLine = [description.trim(), formatWeightForDisplay(weightLabel)]
    .filter(Boolean)
    .join("  •  ");
  const isPlaceholderName = !displayName;
  const isPlaceholderDescription = !descriptionLine;

  const lineHeight = nameFontSize * 1.05;
  const nameLineYs =
    nameLines.length === 1
      ? [NAME_CENTER_Y]
      : [NAME_CENTER_Y - lineHeight / 2, NAME_CENTER_Y + lineHeight / 2];

  return (
    <svg
      ref={ref}
      width={`${WIDTH_MM}mm`}
      height={`${HEIGHT_MM}mm`}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Etiqueta de cozinha: ${displayName || "sem nome"}${
        weightLabel ? `, ${weightLabel}` : ""
      }`}
      className={className}
    >
      <title>{`Etiqueta ${displayName || "sem nome"}`}</title>

      {/* 1. official base template — white interior + ornamental frame */}
      <image
        href={TEMPLATE_BASE_URL}
        x={0}
        y={0}
        width={VIEWBOX_WIDTH}
        height={VIEWBOX_HEIGHT}
        preserveAspectRatio="none"
      />

      {/* 2. official M&S logo, left */}
      <image
        href={LOGO_URL}
        x={LOGO_BOX.x}
        y={LOGO_BOX.y}
        width={LOGO_BOX.width}
        height={LOGO_BOX.height}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* 3. main name, centered */}
      <g fill={INK} fontFamily={SERIF_FONT} fontWeight={700} textAnchor="middle">
        {nameLines.map((line, index) => (
          <text
            key={index}
            x={TEXT_ZONE.centerX}
            y={nameLineYs[index]}
            fontSize={nameFontSize}
            dominantBaseline="middle"
            opacity={isPlaceholderName ? 0.32 : 1}
            fill={isPlaceholderName ? "#8a8a8a" : INK}
          >
            {line}
          </text>
        ))}
      </g>

      {/* 4. description + weight, below the name */}
      <text
        x={TEXT_ZONE.centerX}
        y={DESCRIPTION_Y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={SERIF_FONT}
        fontSize={44}
        letterSpacing={2}
        fill={isPlaceholderDescription ? "#8a8a8a" : INK}
        opacity={isPlaceholderDescription ? 0.32 : 1}
      >
        {descriptionLine || WEIGHT_PLACEHOLDER}
      </text>

      {/* 5. official illustration, right */}
      {illustrationUrl && (
        <image
          href={illustrationUrl}
          x={ILLUSTRATION_BOX.x}
          y={ILLUSTRATION_BOX.y}
          width={ILLUSTRATION_BOX.width}
          height={ILLUSTRATION_BOX.height}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* 6. official frame overlay, on top so the ornamental border is never occluded */}
      <image
        href={TEMPLATE_OVERLAY_URL}
        x={0}
        y={0}
        width={VIEWBOX_WIDTH}
        height={VIEWBOX_HEIGHT}
        preserveAspectRatio="none"
      />
    </svg>
  );
});
