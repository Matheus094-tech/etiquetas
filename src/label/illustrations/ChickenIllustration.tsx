import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

/** A whole dressed chicken with wing fold, tail feathers and leg detail, dense vintage engraving line style. */
export function ChickenIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="chicken-clip-body">
          <path d="M120,58 C162,58 188,90 188,130 C188,163 165,187 130,193 L108,193 C76,187 54,161 54,128 C54,90 80,58 120,58 Z" />
        </clipPath>
      </defs>

      <HatchLines x={54} y={58} width={134} height={135} clipPathId="chicken-clip-body" spacing={8} angle={40} strokeWidth={1.5} />
      <HatchLines x={54} y={58} width={134} height={135} clipPathId="chicken-clip-body" spacing={13} angle={120} strokeWidth={1} opacity={0.5} />

      <path d="M120,58 C162,58 188,90 188,130 C188,163 165,187 130,193 L108,193 C76,187 54,161 54,128 C54,90 80,58 120,58 Z" />
      <path
        d="M64,124 C64,92 88,66 120,66 C154,66 178,92 178,126"
        strokeWidth={1.3}
        opacity={0.65}
      />

      <path d="M152,98 C168,108 176,124 174,144" strokeWidth={2} />
      <path d="M156,106 C166,114 171,126 170,138" strokeWidth={1.2} opacity={0.7} />
      <path d="M148,112 C158,118 163,128 162,140" strokeWidth={1.2} opacity={0.7} />

      <g strokeWidth={1.8} opacity={0.9}>
        <path d="M172,76 C182,66 194,62 206,64" />
        <path d="M174,82 C186,76 198,75 208,80" />
        <path d="M174,88 C184,86 194,88 202,94" />
      </g>

      <path d="M64,96 C70,90 78,84 88,80" strokeWidth={1.6} opacity={0.7} />
      <path d="M70,108 C76,102 84,96 94,92" strokeWidth={1.6} opacity={0.7} />
      <path d="M78,120 C84,114 92,108 102,104" strokeWidth={1.6} opacity={0.7} />

      <path d="M96,193 C90,208 90,222 100,231 C108,238 118,234 118,222 C118,208 112,196 104,190" strokeWidth={2.6} />
      <path d="M140,193 C146,208 146,222 136,231 C128,238 118,234 118,222" strokeWidth={2.6} />
      <path d="M101,205 L98,214" strokeWidth={1.4} opacity={0.7} />
      <path d="M135,205 L138,214" strokeWidth={1.4} opacity={0.7} />
      <path d="M96,224 L84,222" strokeWidth={1.8} />
      <path d="M96,224 L88,232" strokeWidth={1.8} />
      <path d="M96,224 L90,214" strokeWidth={1.8} />
      <path d="M140,224 L152,222" strokeWidth={1.8} />
      <path d="M140,224 L148,232" strokeWidth={1.8} />
      <path d="M140,224 L146,214" strokeWidth={1.8} />

      <path d="M84,90 C90,96 98,98 106,96" strokeWidth={2} />
    </g>
  );
}
