import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

const PEBBLES: { x: number; y: number; r: number }[] = [
  { x: 70, y: 150, r: 6 },
  { x: 85, y: 138, r: 5.5 },
  { x: 100, y: 128, r: 6 },
  { x: 118, y: 118, r: 5.5 },
  { x: 135, y: 122, r: 6 },
  { x: 152, y: 130, r: 5.5 },
  { x: 168, y: 140, r: 6 },
  { x: 180, y: 152, r: 5.5 },
  { x: 65, y: 168, r: 6 },
  { x: 82, y: 158, r: 5 },
  { x: 98, y: 148, r: 5.5 },
  { x: 115, y: 140, r: 5 },
  { x: 132, y: 144, r: 5.5 },
  { x: 148, y: 150, r: 5 },
  { x: 165, y: 160, r: 5.5 },
  { x: 178, y: 170, r: 5 },
  { x: 75, y: 182, r: 5.5 },
  { x: 92, y: 172, r: 5 },
  { x: 110, y: 164, r: 5.5 },
  { x: 128, y: 160, r: 5 },
  { x: 144, y: 166, r: 5.5 },
  { x: 160, y: 176, r: 5 },
  { x: 90, y: 188, r: 5 },
  { x: 108, y: 182, r: 5.5 },
  { x: 126, y: 178, r: 5 },
  { x: 142, y: 184, r: 5.5 },
];

/** A generous mound of ground meat pebbled with clumps, piled in a butcher's tray, dense vintage engraving line style. */
export function GroundBeefIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="beef-clip-mound">
          <path d="M45,190 C38,158 55,132 88,122 C95,101 122,90 144,105 C171,93 199,113 190,138 C209,150 202,174 178,186 C148,199 82,199 45,190 Z" />
        </clipPath>
        <clipPath id="beef-clip-right-wall">
          <path d="M188,158 L206,172 L206,192 L188,178 Z" />
        </clipPath>
      </defs>

      {/* tray */}
      <g strokeWidth={2.4}>
        <path d="M28,178 L188,158 L206,172 L206,192 L188,178 L44,198 L28,198 Z" fill="#ffffff" />
        <path d="M28,178 L188,158 L206,172 L44,192 Z" />
        <path d="M28,178 L44,192 L44,198 L28,198 Z" />
      </g>
      <HatchLines x={188} y={158} width={18} height={34} clipPathId="beef-clip-right-wall" spacing={4} angle={60} strokeWidth={1.3} />
      <path d="M40,182 L40,196" strokeWidth={1.3} opacity={0.6} />
      <path d="M56,190 L56,197" strokeWidth={1.3} opacity={0.6} />
      <path d="M72,187 L72,194" strokeWidth={1.3} opacity={0.6} />

      {/* mound */}
      <HatchLines x={38} y={90} width={162} height={109} clipPathId="beef-clip-mound" spacing={9} angle={55} strokeWidth={1.2} opacity={0.5} />
      <g clipPath="url(#beef-clip-mound)">
        {PEBBLES.map((pebble, index) => (
          <circle key={index} cx={pebble.x} cy={pebble.y} r={pebble.r} fill="#ffffff" strokeWidth={1.4} />
        ))}
        {PEBBLES.map((pebble, index) => (
          <circle
            key={`shade-${index}`}
            cx={pebble.x - pebble.r * 0.3}
            cy={pebble.y - pebble.r * 0.3}
            r={pebble.r * 0.32}
            fill="none"
            stroke={INK}
            strokeWidth={0.9}
            opacity={0.55}
          />
        ))}
      </g>
      <path d="M45,190 C38,158 55,132 88,122 C95,101 122,90 144,105 C171,93 199,113 190,138 C209,150 202,174 178,186 C148,199 82,199 45,190 Z" />
    </g>
  );
}
