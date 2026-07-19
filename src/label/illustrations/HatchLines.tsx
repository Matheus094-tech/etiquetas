interface HatchLinesProps {
  x: number;
  y: number;
  width: number;
  height: number;
  clipPathId: string;
  spacing?: number;
  angle?: number;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Draws a field of parallel diagonal lines clipped to a shape, producing the
 * crosshatch shading typical of old engraving illustrations.
 */
export function HatchLines({
  x,
  y,
  width,
  height,
  clipPathId,
  spacing = 9,
  angle = 45,
  stroke = "#1a1a1a",
  strokeWidth = 2,
}: HatchLinesProps) {
  const diagonal = Math.sqrt(width * width + height * height);
  const count = Math.ceil(diagonal / spacing);
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const px = -dy;
  const py = dx;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const lines = [];
  for (let i = -count; i <= count; i += 1) {
    const offset = i * spacing;
    const ox = cx + px * offset;
    const oy = cy + py * offset;
    lines.push({
      x1: ox - dx * diagonal,
      y1: oy - dy * diagonal,
      x2: ox + dx * diagonal,
      y2: oy + dy * diagonal,
    });
  }

  return (
    <g clipPath={`url(#${clipPathId})`}>
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
    </g>
  );
}
