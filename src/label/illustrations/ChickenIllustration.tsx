import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

/** A whole chicken silhouette, vintage engraving line style. */
export function ChickenIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="chicken-clip-body">
          <path d="M120,58 C162,58 188,90 188,130 C188,163 165,187 130,193 L108,193 C76,187 54,161 54,128 C54,90 80,58 120,58 Z" />
        </clipPath>
      </defs>

      <HatchLines x={54} y={58} width={134} height={135} clipPathId="chicken-clip-body" spacing={8} angle={40} strokeWidth={1.5} />

      <path d="M120,58 C162,58 188,90 188,130 C188,163 165,187 130,193 L108,193 C76,187 54,161 54,128 C54,90 80,58 120,58 Z" />

      <path d="M188,110 C200,104 210,108 212,118 C214,128 205,136 194,132" strokeWidth={2.4} />

      <path d="M96,193 C90,208 90,222 100,231 C108,238 118,234 118,222 C118,208 112,196 104,190" strokeWidth={2.6} />
      <path d="M140,193 C146,208 146,222 136,231 C128,238 118,234 118,222" strokeWidth={2.6} />

      <path d="M84,90 C90,96 98,98 106,96" strokeWidth={2} />
    </g>
  );
}
