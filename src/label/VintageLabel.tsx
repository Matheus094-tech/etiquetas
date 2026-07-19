import { forwardRef, useMemo } from "react";
import { LabelIllustration } from "./LabelIllustration";
import type { IllustrationKey } from "./label.types";
import { fitText } from "../utils/fitText";
import { formatWeightLabel } from "../utils/normalizeWeight";
import { selectIllustration } from "../utils/selectIllustration";

export interface VintageLabelProps {
  name: string;
  description: string;
  weight: string;
  illustration: IllustrationKey;
  className?: string;
}

const WIDTH = 1200;
const HEIGHT = 750;
const INK = "#1a1a1a";
const SERIF_FONT = 'Georgia, "Times New Roman", Times, serif';

const FRAME = { x: 24, y: 24, width: 1152, height: 702, radius: 14 };
const INNER_BORDER = { x: 44, y: 44, width: 1112, height: 662, radius: 8 };

const MEDALLION = { cx: 190, cy: 375, outerR: 108, innerR: 92 };
const ILLUSTRATION_SLOT = { x: 850, y: 90, width: 270, height: 570 };
const TEXT_ZONE = { x1: 340, x2: 800, centerX: 570 };

const NAME_CENTER_Y = 340;
const DIVIDER_Y = 428;
const DESCRIPTION_Y = 478;

const NAME_PLACEHOLDER = "NOME DO ALIMENTO";
const WEIGHT_PLACEHOLDER = "PESO";

interface CornerOrnamentProps {
  x: number;
  y: number;
  flipX?: 1 | -1;
  flipY?: 1 | -1;
}

function CornerOrnament({ x, y, flipX = 1, flipY = 1 }: CornerOrnamentProps) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flipX} ${flipY})`}
      stroke={INK}
      strokeWidth={2.5}
      fill="none"
      strokeLinecap="round"
    >
      <path d="M4,42 C4,20 20,4 42,4" />
      <path d="M16,42 C16,28 28,16 42,16" />
      <path d="M22,22 L30,14 L38,22 L30,30 Z" />
    </g>
  );
}

interface CenterOrnamentProps {
  x: number;
  y: number;
}

function CenterOrnament({ x, y }: CenterOrnamentProps) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={2.5} strokeLinecap="round">
      <path d="M0,-15 L6,0 L0,15 L-6,0 Z" fill="#ffffff" />
      <circle cx="-26" cy="0" r="3" fill={INK} stroke="none" />
      <circle cx="26" cy="0" r="3" fill={INK} stroke="none" />
    </g>
  );
}

function Medallion() {
  const { cx, cy, outerR, innerR } = MEDALLION;
  const ticks = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * (innerR + 4);
    const y1 = cy + Math.sin(angle) * (innerR + 4);
    const x2 = cx + Math.cos(angle) * (outerR - 2);
    const y2 = cy + Math.sin(angle) * (outerR - 2);
    return { x1, y1, x2, y2 };
  });

  return (
    <g>
      {ticks.map((tick, index) => (
        <line
          key={index}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy={cy} r={outerR - 10} fill="none" stroke={INK} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={innerR - 14} fill="none" stroke={INK} strokeWidth={2} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={SERIF_FONT}
        fontWeight={700}
        fontSize={54}
        fill={INK}
        letterSpacing={1}
      >
        M&amp;S
      </text>
    </g>
  );
}

/**
 * Deterministic, data-driven vintage kitchen label rendered as a single SVG
 * tree. The same tree powers the live preview and both export formats, so
 * there is no separate "render for export" code path to keep in sync.
 */
export const VintageLabel = forwardRef<SVGSVGElement, VintageLabelProps>(function VintageLabel(
  { name, description, weight, illustration, className },
  ref
) {
  const trimmedName = name.trim();
  const displayName = trimmedName ? trimmedName.toUpperCase() : "";
  const weightLabel = formatWeightLabel(weight);
  const resolvedIllustration = useMemo(
    () => selectIllustration(name, illustration),
    [name, illustration]
  );

  const { lines: nameLines, fontSize: nameFontSize } = useMemo(
    () =>
      fitText(displayName || NAME_PLACEHOLDER, {
        maxWidth: TEXT_ZONE.x2 - TEXT_ZONE.x1 - 40,
        maxFontSize: 132,
        minFontSize: 42,
        fontFamily: SERIF_FONT,
        fontWeight: 700,
      }),
    [displayName]
  );

  const descriptionLine = [description.trim(), weightLabel].filter(Boolean).join("  •  ");
  const isPlaceholderName = !displayName;
  const isPlaceholderDescription = !descriptionLine;

  const lineHeight = nameFontSize * 1.08;
  const nameLineYs =
    nameLines.length === 1
      ? [NAME_CENTER_Y]
      : [NAME_CENTER_Y - lineHeight / 2, NAME_CENTER_Y + lineHeight / 2];

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Etiqueta de cozinha: ${displayName || "sem nome"}${
        weightLabel ? `, ${weightLabel}` : ""
      }`}
      className={className}
    >
      <title>{`Etiqueta ${displayName || "sem nome"}`}</title>

      <defs>
        <clipPath id="vintage-label-illustration-clip">
          <rect
            x={ILLUSTRATION_SLOT.x}
            y={ILLUSTRATION_SLOT.y}
            width={ILLUSTRATION_SLOT.width}
            height={ILLUSTRATION_SLOT.height}
          />
        </clipPath>
      </defs>

      <g id="vintage-label-frame">
        <rect
          x={FRAME.x}
          y={FRAME.y}
          width={FRAME.width}
          height={FRAME.height}
          rx={FRAME.radius}
          fill="#ffffff"
          stroke={INK}
          strokeWidth={7}
        />
        <rect
          x={INNER_BORDER.x}
          y={INNER_BORDER.y}
          width={INNER_BORDER.width}
          height={INNER_BORDER.height}
          rx={INNER_BORDER.radius}
          fill="none"
          stroke={INK}
          strokeWidth={3}
        />
      </g>

      <g id="vintage-label-ornaments">
        <CornerOrnament x={INNER_BORDER.x} y={INNER_BORDER.y} flipX={1} flipY={1} />
        <CornerOrnament x={INNER_BORDER.x + INNER_BORDER.width} y={INNER_BORDER.y} flipX={-1} flipY={1} />
        <CornerOrnament x={INNER_BORDER.x} y={INNER_BORDER.y + INNER_BORDER.height} flipX={1} flipY={-1} />
        <CornerOrnament
          x={INNER_BORDER.x + INNER_BORDER.width}
          y={INNER_BORDER.y + INNER_BORDER.height}
          flipX={-1}
          flipY={-1}
        />
        <CenterOrnament x={WIDTH / 2} y={FRAME.y} />
        <CenterOrnament x={WIDTH / 2} y={FRAME.y + FRAME.height} />

        <line
          x1={302}
          y1={90}
          x2={302}
          y2={660}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.55}
        />
        <line x1={822} y1={90} x2={822} y2={660} stroke={INK} strokeWidth={1.5} opacity={0.55} />
      </g>

      <g id="vintage-label-medallion">
        <Medallion />
      </g>

      <g id="vintage-label-name" fill={INK} fontFamily={SERIF_FONT} fontWeight={700} textAnchor="middle">
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

      <g id="vintage-label-divider" stroke={INK} strokeWidth={1.5} opacity={0.7}>
        <line x1={TEXT_ZONE.centerX - 110} y1={DIVIDER_Y} x2={TEXT_ZONE.centerX - 18} y2={DIVIDER_Y} />
        <line x1={TEXT_ZONE.centerX + 18} y1={DIVIDER_Y} x2={TEXT_ZONE.centerX + 110} y2={DIVIDER_Y} />
        <circle cx={TEXT_ZONE.centerX} cy={DIVIDER_Y} r="5" fill="none" />
      </g>

      <g id="vintage-label-description" fontFamily={SERIF_FONT} textAnchor="middle">
        <text
          x={TEXT_ZONE.centerX}
          y={DESCRIPTION_Y}
          fontSize={34}
          letterSpacing={1.5}
          dominantBaseline="middle"
          fill={isPlaceholderDescription ? "#8a8a8a" : INK}
          opacity={isPlaceholderDescription ? 0.32 : 1}
        >
          {descriptionLine || WEIGHT_PLACEHOLDER}
        </text>
      </g>

      <g id="vintage-label-illustration">
        <LabelIllustration
          illustration={resolvedIllustration}
          x={ILLUSTRATION_SLOT.x}
          y={ILLUSTRATION_SLOT.y}
          width={ILLUSTRATION_SLOT.width}
          height={ILLUSTRATION_SLOT.height}
          clipId="vintage-label-illustration-clip"
        />
      </g>
    </svg>
  );
});
