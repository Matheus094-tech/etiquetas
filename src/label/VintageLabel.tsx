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

/** Official M&S label proportion: 3:1 (width:height). */
const WIDTH = 1800;
const HEIGHT = 600;
const INK = "#1a1a1a";
const SERIF_FONT = 'Georgia, "Times New Roman", Times, serif';

/** Outer frame: a rounded rectangle whose corners "pinch" inward near the tip — the classic vintage tag/plant-marker corner treatment. */
const FRAME = { x: 24, y: 24, width: 1752, height: 552 };
const FRAME_D_OUTER = 50;
const FRAME_GAP = 14;
const FRAME_D_INNER = FRAME_D_OUTER - FRAME_GAP;

const MEDALLION = { cx: 168, cy: 300, scallopR: 100 };
const ILLUSTRATION_SLOT = { x: 1300, y: 108, width: 390, height: 384 };
const TEXT_ZONE = { x1: 330, x2: 1240, centerX: 785 };

const TOP_RULE_Y = 80;
const BOTTOM_RULE_Y = 520;
const RULE_X1 = 128;
const RULE_X2 = 1672;

const NAME_CENTER_Y = 270;
const DIVIDER_Y = 378;
const DESCRIPTION_Y = 426;

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

type Vec = [number, number];

/**
 * One rounded-then-pinched corner: a wide convex curve that hugs the true
 * corner tip, followed by a small concave "waist" before settling onto the
 * next edge. `inAxis`/`outAxis` are unit vectors pointing back along the
 * incoming edge and forward along the outgoing edge, so the same formula
 * works for all four corners of a clockwise rectangle traversal.
 */
function cornerCurve(vertex: Vec, inAxis: Vec, outAxis: Vec, d: number): string {
  const p = (alongIn: number, alongOut: number) =>
    `${vertex[0] + inAxis[0] * alongIn + outAxis[0] * alongOut},${
      vertex[1] + inAxis[1] * alongIn + outAxis[1] * alongOut
    }`;
  return (
    `C ${p(d * 0.42, 0)} ${p(d * 0.03, d * 0.3)} ${p(d * 0.17, d * 0.62)} ` +
    `C ${p(d * 0.31, d * 0.72)} ${p(d * 0.24, d * 0.9)} ${p(0, d)}`
  );
}

/** Builds a closed rectangle path with the pinched-corner treatment on all four corners. */
function pinchedFramePath(x: number, y: number, width: number, height: number, d: number): string {
  const x2 = x + width;
  const y2 = y + height;
  return [
    `M ${x + d},${y}`,
    `L ${x2 - d},${y}`,
    cornerCurve([x2, y], [-1, 0], [0, 1], d),
    `L ${x2},${y2 - d}`,
    cornerCurve([x2, y2], [0, -1], [-1, 0], d),
    `L ${x + d},${y2}`,
    cornerCurve([x, y2], [1, 0], [0, -1], d),
    `L ${x},${y + d}`,
    cornerCurve([x, y], [0, 1], [1, 0], d),
    "Z",
  ].join(" ");
}

/**
 * A scalloped seal-edge circle outline with sharp, slightly irregular teeth
 * (alternating valley/peak radius joined by straight segments) — matching
 * the M&S medallion's jagged stamp-like border rather than soft rounded bumps.
 */
function scallopedCirclePath(cx: number, cy: number, r: number, toothDepth: number, count: number): string {
  const points = count * 2;
  const step = (Math.PI * 2) / points;
  const parts: string[] = [];
  for (let i = 0; i < points; i += 1) {
    const angle = i * step;
    const radius = i % 2 === 0 ? r : r + toothDepth;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    parts.push(`${i === 0 ? "M" : "L"} ${x},${y}`);
  }
  return `${parts.join(" ")} Z`;
}

interface FleuronProps {
  x: number;
  y: number;
  scale?: number;
  flip?: 1 | -1;
}

/** A small trefoil flourish — the typographic "fleuron" used throughout the label. */
function Fleuron({ x, y, scale = 1, flip = 1 }: FleuronProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale} ${scale * flip})`} fill={INK} stroke="none">
      <path d="M0,-22 C6,-14 8,-4 4,4 C2,8 -2,8 -4,4 C-8,-4 -6,-14 0,-22 Z" />
      <path d="M-4,2 C-10,0 -16,3 -18,9 C-14,10 -8,8 -4,4 Z" />
      <path d="M4,2 C10,0 16,3 18,9 C14,10 8,8 4,4 Z" />
    </g>
  );
}

interface DecorativeRuleProps {
  x: number;
  y: number;
  width: number;
  flip?: 1 | -1;
}

/** A rule flanked by end dots with a fleuron centered — the recurring header/divider motif. */
function DecorativeRule({ x, y, width, flip = 1 }: DecorativeRuleProps) {
  const half = width / 2;
  return (
    <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
      <line x1={x - half} y1={y} x2={x - 24} y2={y} />
      <line x1={x + 24} y1={y} x2={x + half} y2={y} />
      <circle cx={x - half} cy={y} r={3.2} fill={INK} stroke="none" />
      <circle cx={x + half} cy={y} r={3.2} fill={INK} stroke="none" />
      <Fleuron x={x} y={y} scale={0.6} flip={flip} />
    </g>
  );
}

function Medallion() {
  const { cx, cy, scallopR } = MEDALLION;
  const scallopPath = scallopedCirclePath(cx, cy, scallopR, 11, 20);
  const ringR = scallopR - 14;
  const innerRingR = ringR - 5;

  return (
    <g>
      <path d={scallopPath} fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={INK} strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={innerRingR} fill="none" stroke={INK} strokeWidth={1} opacity={0.75} />

      <DecorativeRule x={cx} y={cy - 28} width={100} flip={1} />
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={SERIF_FONT}
        fontWeight={700}
        fontSize={44}
        fill={INK}
        letterSpacing={1}
      >
        M&amp;S
      </text>
      <DecorativeRule x={cx} y={cy + 40} width={100} flip={-1} />
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
        maxFontSize: 140,
        minFontSize: 40,
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

  const outerFramePath = pinchedFramePath(FRAME.x, FRAME.y, FRAME.width, FRAME.height, FRAME_D_OUTER);
  const innerFramePath = pinchedFramePath(
    FRAME.x + FRAME_GAP,
    FRAME.y + FRAME_GAP,
    FRAME.width - FRAME_GAP * 2,
    FRAME.height - FRAME_GAP * 2,
    FRAME_D_INNER
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
        <path d={outerFramePath} fill="#ffffff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={innerFramePath} fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      </g>

      <g id="vintage-label-rules">
        <DecorativeRule x={WIDTH / 2} y={TOP_RULE_Y} width={RULE_X2 - RULE_X1} />
        <DecorativeRule x={WIDTH / 2} y={BOTTOM_RULE_Y} width={RULE_X2 - RULE_X1} flip={-1} />
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

      <g id="vintage-label-divider" opacity={isPlaceholderDescription ? 0.4 : 1}>
        <DecorativeRule x={TEXT_ZONE.centerX} y={DIVIDER_Y} width={260} />
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
