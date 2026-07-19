import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

const POTATOES: { cx: number; cy: number; r: number; eyes: [number, number][] }[] = [
  {
    cx: 72,
    cy: 134,
    r: 27,
    eyes: [
      [64, 126],
      [80, 138],
      [70, 146],
    ],
  },
  {
    cx: 118,
    cy: 106,
    r: 23,
    eyes: [
      [110, 100],
      [126, 110],
    ],
  },
  {
    cx: 168,
    cy: 116,
    r: 24,
    eyes: [
      [160, 110],
      [176, 122],
    ],
  },
  {
    cx: 193,
    cy: 146,
    r: 21,
    eyes: [
      [186, 140],
      [200, 150],
    ],
  },
  {
    cx: 94,
    cy: 160,
    r: 22,
    eyes: [
      [88, 154],
      [100, 166],
    ],
  },
];

const MEAT_CHUNKS = [
  "M96,142 L116,118 L142,126 L136,154 L110,160 Z",
  "M136,104 L160,94 L176,112 L158,130 L140,124 Z",
];

/** A bowl of whole potatoes with meat chunks and a parsley sprig, dense vintage engraving line style. */
export function PotatoBeefIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="pb-clip-bowl">
          <path d="M32,164 C32,190 68,210 120,210 C172,210 208,190 208,164 L32,164 Z" />
        </clipPath>
        <clipPath id="pb-clip-potatoes">
          {POTATOES.map((potato, index) => (
            <circle key={index} cx={potato.cx} cy={potato.cy} r={potato.r} />
          ))}
        </clipPath>
        <clipPath id="pb-clip-meat">
          {MEAT_CHUNKS.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </clipPath>
      </defs>

      {/* bowl */}
      <HatchLines x={32} y={164} width={176} height={46} clipPathId="pb-clip-bowl" spacing={7} angle={50} strokeWidth={1.1} opacity={0.5} />
      <path d="M32,164 C32,190 68,210 120,210 C172,210 208,190 208,164" />
      <path d="M42,168 C42,188 72,203 120,203" strokeWidth={1.3} opacity={0.6} />
      <ellipse cx="120" cy="164" rx="76" ry="16" />
      <ellipse cx="120" cy="164" rx="60" ry="11" strokeWidth={1.3} opacity={0.6} />

      {/* potatoes */}
      <HatchLines x={45} y={83} width={169} height={99} clipPathId="pb-clip-potatoes" spacing={7} angle={30} strokeWidth={1.4} />
      <HatchLines x={45} y={83} width={169} height={99} clipPathId="pb-clip-potatoes" spacing={12} angle={115} strokeWidth={0.9} opacity={0.5} />
      {POTATOES.map((potato, index) => (
        <g key={index}>
          <circle cx={potato.cx} cy={potato.cy} r={potato.r} />
          {potato.eyes.map(([ex, ey], eyeIndex) => (
            <circle key={eyeIndex} cx={ex} cy={ey} r={2.2} fill={INK} stroke="none" />
          ))}
        </g>
      ))}

      {/* meat chunks */}
      <HatchLines x={96} y={94} width={80} height={66} clipPathId="pb-clip-meat" spacing={6} angle={65} strokeWidth={1.5} />
      {MEAT_CHUNKS.map((d, index) => (
        <path key={index} d={d} strokeWidth={2.2} />
      ))}

      {/* parsley sprig */}
      <g strokeWidth={1.6}>
        <path d="M132,86 C130,72 134,60 130,48" />
        {[
          { at: 0.2, dx: -12, dy: -6 },
          { at: 0.42, dx: 12, dy: -6 },
          { at: 0.64, dx: -11, dy: -6 },
          { at: 0.86, dx: 10, dy: -6 },
        ].map((leaf, index) => {
          const px = 132 - leaf.at * 2;
          const py = 86 - leaf.at * 38;
          return <path key={index} d={`M${px},${py} q${leaf.dx},${leaf.dy} ${leaf.dx * 1.6},${leaf.dy}`} strokeWidth={1.3} />;
        })}
      </g>
    </g>
  );
}
