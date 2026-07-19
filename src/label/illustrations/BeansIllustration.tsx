import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

const BEANS: { x: number; y: number; rotate: number; scale: number }[] = [
  { x: 90, y: 148, rotate: 15, scale: 1 },
  { x: 112, y: 132, rotate: -20, scale: 0.9 },
  { x: 136, y: 142, rotate: 35, scale: 1 },
  { x: 155, y: 158, rotate: -10, scale: 0.85 },
  { x: 103, y: 165, rotate: 60, scale: 0.9 },
  { x: 130, y: 168, rotate: -35, scale: 0.95 },
  { x: 148, y: 130, rotate: 5, scale: 0.8 },
  { x: 80, y: 162, rotate: -45, scale: 0.8 },
  { x: 120, y: 150, rotate: 25, scale: 0.75 },
  { x: 165, y: 142, rotate: -60, scale: 0.75 },
];

const BEAN_PATH = "M-9,-5 C-13,-9 -13,-1 -9,3 C-4,9 6,9 9,3 C13,-2 10,-8 4,-8 C0,-8 -3,-9 -9,-5 Z";

/** A generous bowl of beans with a pod sprig, dense vintage engraving line style. */
export function BeansIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="beans-clip-bowl">
          <path d="M60,152 C60,175 86,196 120,196 C154,196 180,175 180,152 L60,152 Z" />
        </clipPath>
      </defs>

      <HatchLines x={60} y={152} width={120} height={44} clipPathId="beans-clip-bowl" spacing={7} angle={50} strokeWidth={1.2} opacity={0.55} />
      <path d="M60,152 C60,175 86,196 120,196 C154,196 180,175 180,152" />
      <path d="M68,156 C68,174 92,189 120,189" strokeWidth={1.3} opacity={0.6} />
      <ellipse cx="120" cy="152" rx="60" ry="15" />
      <ellipse cx="120" cy="152" rx="48" ry="11" strokeWidth={1.3} opacity={0.6} />
      <ellipse cx="120" cy="134" rx="50" ry="20" />

      {BEANS.map((bean, index) => (
        <g key={index} transform={`translate(${bean.x} ${bean.y}) rotate(${bean.rotate}) scale(${bean.scale})`}>
          <path d={BEAN_PATH} strokeWidth={2} />
          <path d="M-6,-2 C-2,-4 2,-4 6,-1" strokeWidth={1} opacity={0.6} />
        </g>
      ))}

      <g strokeWidth={1.8}>
        <path d="M188,118 C185,102 190,88 202,80" />
        <path d="M190,112 C198,110 206,104 210,96 C213,90 212,84 206,84 C200,84 196,90 194,98 C192,104 190,108 190,112 Z" />
        <path d="M194,98 C198,96 202,96 205,98" strokeWidth={1} opacity={0.6} />
      </g>
    </g>
  );
}
