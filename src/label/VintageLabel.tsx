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

/** Outer frame with 45° cut corners — the "elegant notch" look of a classic product label. */
const FRAME = { x: 20, y: 20, width: 1160, height: 710, notch: 46 };
const FRAME_INSET_1 = 17;
const FRAME_INSET_2 = 25;

const MEDALLION = { cx: 196, cy: 375, outerR: 120, innerR: 98 };
const ILLUSTRATION_SLOT = { x: 830, y: 78, width: 300, height: 604 };
const TEXT_ZONE = { x1: 350, x2: 800, centerX: 575 };

const NAME_CENTER_Y = 322;
const DIVIDER_Y = 440;
const DESCRIPTION_Y = 492;

const NAME_PLACEHOLDER = "NOME DO ALIMENTO";
const WEIGHT_PLACEHOLDER = "PESO";

/**
 * Adds a "." thousands separator to the digits of a formatted weight label
 * for display on the label (e.g. "1560g" -> "1.560g"). Purely cosmetic —
 * the underlying stored/filename value stays a plain number.
 */
function formatWeightForDisplay(weightLabel: string): string {
  const match = weightLabel.match(/^(\d+)(.*)$/);
  if (!match) return weightLabel;
  const [, digits, rest] = match;
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${rest}`;
}

/** Builds a rectangle path with its four corners chamfered at 45°. */
function notchedRectPath(x: number, y: number, width: number, height: number, notch: number): string {
  const x2 = x + width;
  const y2 = y + height;
  return [
    `M ${x + notch} ${y}`,
    `L ${x2 - notch} ${y}`,
    `L ${x2} ${y + notch}`,
    `L ${x2} ${y2 - notch}`,
    `L ${x2 - notch} ${y2}`,
    `L ${x + notch} ${y2}`,
    `L ${x} ${y2 - notch}`,
    `L ${x} ${y + notch}`,
    "Z",
  ].join(" ");
}

interface CornerOrnamentProps {
  x: number;
  y: number;
  flipX?: 1 | -1;
  flipY?: 1 | -1;
}

/** A richer scrollwork flourish tucked into each chamfered corner. */
function CornerOrnament({ x, y, flipX = 1, flipY = 1 }: CornerOrnamentProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flipX} ${flipY})`}>
      <path
        d="M4,26 L26,4"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
      <g stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round">
        <path d="M8,78 C8,40 40,8 78,8" />
        <path d="M22,78 C22,50 50,22 78,22" />
        <path d="M36,78 C36,60 60,36 78,36" />
      </g>
      <g stroke={INK} strokeWidth={1.3} opacity={0.75}>
        <path d="M14,54 L24,44" />
        <path d="M20,60 L30,50" />
        <path d="M26,66 L36,56" />
      </g>
      <path
        d="M30,30 L38,22 L46,30 L38,38 Z"
        fill="#ffffff"
        stroke={INK}
        strokeWidth={2}
      />
    </g>
  );
}

interface CenterOrnamentProps {
  x: number;
  y: number;
  flip?: 1 | -1;
}

/** A small fleuron bridging the top/bottom border, tendrils curling outward. */
function CenterOrnament({ x, y, flip = 1 }: CenterOrnamentProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${flip})`}>
      <path
        d="M0,-8 C11,-2 11,18 0,27 C-11,18 -11,-2 0,-8 Z"
        fill="#ffffff"
        stroke={INK}
        strokeWidth={2.2}
      />
      <line x1="0" y1="10" x2="0" y2="19" stroke={INK} strokeWidth={1.6} />
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-10,17 C-26,21 -34,31 -50,29" />
        <path d="M10,17 C26,21 34,31 50,29" />
      </g>
      <circle cx="-54" cy="28" r="3" fill={INK} stroke="none" />
      <circle cx="54" cy="28" r="3" fill={INK} stroke="none" />
    </g>
  );
}

interface LaurelSprigProps {
  x: number;
  y: number;
  flipX?: 1 | -1;
}

/** A small laurel sprig for the medallion, in the wax-seal tradition. */
function LaurelSprig({ x, y, flipX = 1 }: LaurelSprigProps) {
  const leaves = [8, 22, 36, 50];
  return (
    <g transform={`translate(${x} ${y}) scale(${flipX} 1)`} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
      <path d="M0,0 C14,-6 32,-8 54,-2" />
      {leaves.map((offset, index) => (
        <path
          key={index}
          d={`M${offset},${-2 - offset * 0.06} C${offset + 6},${-10 - offset * 0.06} ${offset + 6},${
            -18 - offset * 0.06
          } ${offset},${-22 - offset * 0.06}`}
          transform={`rotate(${8 + index * 4} ${offset} ${-2 - offset * 0.06})`}
        />
      ))}
    </g>
  );
}

function Medallion() {
  const { cx, cy, outerR, innerR } = MEDALLION;
  const tickCount = 56;
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const angle = (index / tickCount) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * (outerR - 12);
    const y1 = cy + Math.sin(angle) * (outerR - 12);
    const x2 = cx + Math.cos(angle) * outerR;
    const y2 = cy + Math.sin(angle) * outerR;
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
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy={cy} r={outerR - 16} fill="none" stroke={INK} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={INK} strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={innerR - 6} fill="none" stroke={INK} strokeWidth={1} opacity={0.7} />

      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={SERIF_FONT}
        fontWeight={700}
        fontSize={52}
        fill={INK}
        letterSpacing={1}
      >
        M&amp;S
      </text>
      <path
        d={`M${cx - 30},${cy + 14} C${cx - 14},${cy + 19} ${cx + 14},${cy + 19} ${cx + 30},${cy + 14}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.6}
      />

      <LaurelSprig x={cx - 8} y={cy + innerR - 10} flipX={-1} />
      <LaurelSprig x={cx + 8} y={cy + innerR - 10} flipX={1} />
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
        maxWidth: TEXT_ZONE.x2 - TEXT_ZONE.x1 - 20,
        maxFontSize: 156,
        minFontSize: 46,
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

  const outerFramePath = notchedRectPath(FRAME.x, FRAME.y, FRAME.width, FRAME.height, FRAME.notch);
  const innerLine1Path = notchedRectPath(
    FRAME.x + FRAME_INSET_1,
    FRAME.y + FRAME_INSET_1,
    FRAME.width - FRAME_INSET_1 * 2,
    FRAME.height - FRAME_INSET_1 * 2,
    FRAME.notch - FRAME_INSET_1
  );
  const innerLine2Path = notchedRectPath(
    FRAME.x + FRAME_INSET_2,
    FRAME.y + FRAME_INSET_2,
    FRAME.width - FRAME_INSET_2 * 2,
    FRAME.height - FRAME_INSET_2 * 2,
    FRAME.notch - FRAME_INSET_2
  );

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
        <path d={outerFramePath} fill="#ffffff" stroke={INK} strokeWidth={13} strokeLinejoin="round" />
        <path d={innerLine1Path} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={innerLine2Path} fill="none" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      </g>

      <g id="vintage-label-ornaments">
        <CornerOrnament x={FRAME.x + FRAME_INSET_2} y={FRAME.y + FRAME_INSET_2} flipX={1} flipY={1} />
        <CornerOrnament
          x={FRAME.x + FRAME.width - FRAME_INSET_2}
          y={FRAME.y + FRAME_INSET_2}
          flipX={-1}
          flipY={1}
        />
        <CornerOrnament
          x={FRAME.x + FRAME_INSET_2}
          y={FRAME.y + FRAME.height - FRAME_INSET_2}
          flipX={1}
          flipY={-1}
        />
        <CornerOrnament
          x={FRAME.x + FRAME.width - FRAME_INSET_2}
          y={FRAME.y + FRAME.height - FRAME_INSET_2}
          flipX={-1}
          flipY={-1}
        />
        <CenterOrnament x={WIDTH / 2} y={FRAME.y} flip={1} />
        <CenterOrnament x={WIDTH / 2} y={FRAME.y + FRAME.height} flip={-1} />
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

      <g id="vintage-label-divider" stroke={INK} strokeLinecap="round">
        <line
          x1={TEXT_ZONE.centerX - 140}
          y1={DIVIDER_Y}
          x2={TEXT_ZONE.centerX - 20}
          y2={DIVIDER_Y}
          strokeWidth={1.4}
          opacity={0.8}
        />
        <line
          x1={TEXT_ZONE.centerX + 20}
          y1={DIVIDER_Y}
          x2={TEXT_ZONE.centerX + 140}
          y2={DIVIDER_Y}
          strokeWidth={1.4}
          opacity={0.8}
        />
        <path
          d={`M${TEXT_ZONE.centerX},${DIVIDER_Y - 7} L${TEXT_ZONE.centerX + 7},${DIVIDER_Y} L${TEXT_ZONE.centerX},${
            DIVIDER_Y + 7
          } L${TEXT_ZONE.centerX - 7},${DIVIDER_Y} Z`}
          fill="#ffffff"
          strokeWidth={1.6}
        />
        <circle cx={TEXT_ZONE.centerX - 20} cy={DIVIDER_Y} r="2.4" fill={INK} stroke="none" />
        <circle cx={TEXT_ZONE.centerX + 20} cy={DIVIDER_Y} r="2.4" fill={INK} stroke="none" />
      </g>

      <g id="vintage-label-description" fontFamily={SERIF_FONT} textAnchor="middle">
        <text
          x={TEXT_ZONE.centerX}
          y={DESCRIPTION_Y}
          fontSize={34}
          letterSpacing={2}
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
