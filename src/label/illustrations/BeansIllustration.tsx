const INK = "#1a1a1a";

const BEANS: { x: number; y: number; rotate: number; scale: number }[] = [
  { x: 90, y: 148, rotate: 15, scale: 1 },
  { x: 112, y: 132, rotate: -20, scale: 0.9 },
  { x: 136, y: 142, rotate: 35, scale: 1 },
  { x: 155, y: 158, rotate: -10, scale: 0.85 },
  { x: 103, y: 165, rotate: 60, scale: 0.9 },
  { x: 130, y: 168, rotate: -35, scale: 0.95 },
  { x: 148, y: 130, rotate: 5, scale: 0.8 },
];

const BEAN_PATH = "M-9,-5 C-13,-9 -13,-1 -9,3 C-4,9 6,9 9,3 C13,-2 10,-8 4,-8 C0,-8 -3,-9 -9,-5 Z";

/** A bowl of beans, vintage engraving line style. */
export function BeansIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M60,152 C60,175 86,196 120,196 C154,196 180,175 180,152" />
      <ellipse cx="120" cy="152" rx="60" ry="15" />
      <ellipse cx="120" cy="134" rx="50" ry="20" />

      {BEANS.map((bean, index) => (
        <path
          key={index}
          d={BEAN_PATH}
          strokeWidth={2}
          transform={`translate(${bean.x} ${bean.y}) rotate(${bean.rotate}) scale(${bean.scale})`}
        />
      ))}
    </g>
  );
}
