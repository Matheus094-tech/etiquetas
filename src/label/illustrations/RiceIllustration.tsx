const INK = "#1a1a1a";

const GRAINS: { x: number; y: number; rotate: number }[] = [
  { x: 85, y: 130, rotate: -20 },
  { x: 100, y: 118, rotate: 10 },
  { x: 118, y: 112, rotate: -8 },
  { x: 136, y: 116, rotate: 18 },
  { x: 152, y: 126, rotate: -14 },
  { x: 96, y: 142, rotate: 24 },
  { x: 122, y: 134, rotate: -4 },
  { x: 145, y: 140, rotate: 12 },
];

/** A bowl of rice with steam, vintage engraving line style. */
export function RiceIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M62,150 C62,172 87,192 120,192 C153,192 178,172 178,150" />
      <ellipse cx="120" cy="150" rx="58" ry="14" />
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
    </g>
  );
}
