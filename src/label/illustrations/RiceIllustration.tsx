import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

const GRAINS: { x: number; y: number; rotate: number }[] = [
  { x: 82, y: 132, rotate: -20 },
  { x: 98, y: 118, rotate: 10 },
  { x: 116, y: 111, rotate: -8 },
  { x: 134, y: 115, rotate: 18 },
  { x: 151, y: 124, rotate: -14 },
  { x: 93, y: 144, rotate: 24 },
  { x: 120, y: 133, rotate: -4 },
  { x: 144, y: 139, rotate: 12 },
  { x: 106, y: 126, rotate: -30 },
  { x: 128, y: 122, rotate: 6 },
  { x: 160, y: 136, rotate: -18 },
  { x: 76, y: 141, rotate: 30 },
];

/** A generous bowl of rice with steam and a resting spoon, dense vintage engraving line style. */
export function RiceIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="rice-clip-bowl">
          <path d="M62,150 C62,172 87,192 120,192 C153,192 178,172 178,150 L62,150 Z" />
        </clipPath>
      </defs>

      <HatchLines x={62} y={150} width={116} height={42} clipPathId="rice-clip-bowl" spacing={7} angle={50} strokeWidth={1.2} opacity={0.6} />
      <path d="M62,150 C62,172 87,192 120,192 C153,192 178,172 178,150" />
      <path d="M70,154 C70,170 92,185 120,185" strokeWidth={1.3} opacity={0.6} />
      <ellipse cx="120" cy="150" rx="58" ry="14" />
      <ellipse cx="120" cy="150" rx="46" ry="10" strokeWidth={1.3} opacity={0.6} />
      <ellipse cx="120" cy="134" rx="52" ry="19" />

      {GRAINS.map((grain, index) => (
        <ellipse
          key={index}
          cx={grain.x}
          cy={grain.y}
          rx="7"
          ry="3.2"
          strokeWidth={1.6}
          transform={`rotate(${grain.rotate} ${grain.x} ${grain.y})`}
        />
      ))}

      <path d="M98,98 C93,84 103,74 98,60" strokeWidth={2.2} />
      <path d="M120,98 C115,84 125,74 120,60" strokeWidth={2.2} />
      <path d="M142,98 C137,84 147,74 142,60" strokeWidth={2.2} />
      <path d="M98,98 C95,88 101,80 98,68" strokeWidth={1} opacity={0.55} />
      <path d="M142,98 C139,88 145,80 142,68" strokeWidth={1} opacity={0.55} />

      <ellipse cx="50" cy="176" rx="6" ry="2.8" strokeWidth={1.4} transform="rotate(-24 50 176)" />
      <ellipse cx="60" cy="188" rx="5.5" ry="2.6" strokeWidth={1.4} transform="rotate(18 60 188)" />
      <ellipse cx="188" cy="180" rx="6" ry="2.8" strokeWidth={1.4} transform="rotate(20 188 180)" />
    </g>
  );
}
