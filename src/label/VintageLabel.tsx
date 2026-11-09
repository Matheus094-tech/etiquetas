import { forwardRef, useMemo } from "react";
import { ILLUSTRATION_ASSET_URLS, LOGO_URL, TEMPLATE_BASE_URL, TEMPLATE_OVERLAY_URL } from "./assets";
import { LABEL_DIMENSIONS, LABEL_FONT, LABEL_TEXT_ZONE, layoutLabelText } from "./layout";
import type { IllustrationKey } from "./label.types";
import { cleanLabelName } from "../utils/cleanLabelName";
import { formatWeightForDisplay, formatWeightLabel } from "../utils/normalizeWeight";
import { selectIllustration } from "../utils/selectIllustration";

export interface VintageLabelProps {
  name: string;
  description: string;
  weight: string;
  illustration: IllustrationKey;
  className?: string;
}

const INK = "#000000";
const LOGO_BOX = { x: 100, y: 130, width: 350, height: 340 };
const ILLUSTRATION_BOX = { x: 1510, y: 105, width: 380, height: 390 };

/** The same physical 40 x 12 mm SVG powers the live preview, PNG and SVG exports. */
export const VintageLabel = forwardRef<SVGSVGElement, VintageLabelProps>(function VintageLabel(
  { name, description, weight, illustration, className },
  ref
) {
  const displayName = cleanLabelName(name).toLocaleUpperCase("pt-BR");
  const displayDescription = description.trim().toLocaleUpperCase("pt-BR");
  const weightLabel = formatWeightForDisplay(formatWeightLabel(weight));
  const layout = useMemo(
    () => layoutLabelText(displayName, weightLabel, displayDescription),
    [displayName, weightLabel, displayDescription]
  );
  const resolvedIllustration = useMemo(
    () => selectIllustration(name, description, illustration),
    [name, description, illustration]
  );
  const illustrationUrl =
    resolvedIllustration === "none" ? null : ILLUSTRATION_ASSET_URLS[resolvedIllustration];

  return (
    <svg
      ref={ref}
      width={`${LABEL_DIMENSIONS.widthMm}mm`}
      height={`${LABEL_DIMENSIONS.heightMm}mm`}
      viewBox={`0 0 ${LABEL_DIMENSIONS.viewBoxWidth} ${LABEL_DIMENSIONS.viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Etiqueta de cozinha: ${displayName || "sem nome"}${weightLabel ? `, ${weightLabel}` : ""}`}
      className={className}
    >
      <title>{`Etiqueta ${displayName || "sem nome"}`}</title>
      <image
        href={TEMPLATE_BASE_URL}
        x={0}
        y={0}
        width={LABEL_DIMENSIONS.viewBoxWidth}
        height={LABEL_DIMENSIONS.viewBoxHeight}
        preserveAspectRatio="none"
      />
      <image
        href={LOGO_URL}
        x={LOGO_BOX.x}
        y={LOGO_BOX.y}
        width={LOGO_BOX.width}
        height={LOGO_BOX.height}
        preserveAspectRatio="xMidYMid meet"
      />
      <g fill={INK} fontFamily={LABEL_FONT} fontWeight={700} textAnchor="middle">
        {layout.name.lines.map((line, index) => (
          <text
            key={index}
            data-testid="label-name"
            x={LABEL_TEXT_ZONE.center}
            y={layout.nameY[index]}
            fontSize={layout.name.fontSize}
            dominantBaseline="middle"
            opacity={displayName ? 1 : 0.32}
          >
            {line}
          </text>
        ))}
        <text
          data-testid="label-quantity"
          x={LABEL_TEXT_ZONE.center}
          y={layout.quantityY}
          fontSize={layout.quantityFontSize}
          dominantBaseline="middle"
          opacity={weightLabel ? 1 : 0.32}
        >
          {weightLabel || "PESO"}
        </text>
        {displayDescription && (
          <text
            data-testid="label-description"
            x={LABEL_TEXT_ZONE.center}
            y={layout.descriptionY}
            fontSize={layout.descriptionFontSize}
            dominantBaseline="middle"
            letterSpacing={1}
          >
            {displayDescription}
          </text>
        )}
      </g>
      {illustrationUrl && (
        <image
          data-testid="label-illustration"
          href={illustrationUrl}
          x={ILLUSTRATION_BOX.x}
          y={ILLUSTRATION_BOX.y}
          width={ILLUSTRATION_BOX.width}
          height={ILLUSTRATION_BOX.height}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      <image
        href={TEMPLATE_OVERLAY_URL}
        x={0}
        y={0}
        width={LABEL_DIMENSIONS.viewBoxWidth}
        height={LABEL_DIMENSIONS.viewBoxHeight}
        preserveAspectRatio="none"
      />
    </svg>
  );
});
