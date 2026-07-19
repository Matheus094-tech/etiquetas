import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

/** Carrot with leaves and a small turnip, in vintage engraving line style. */
export function VegetablesIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="veg-clip-carrot">
          <path d="M72,202 C60,190 56,168 66,148 C82,116 112,88 144,66 C154,59 163,54 170,50 C161,63 149,79 136,101 C112,138 88,168 76,196 Z" />
        </clipPath>
      </defs>

      <HatchLines x={56} y={50} width={120} height={155} clipPathId="veg-clip-carrot" spacing={8} angle={128} strokeWidth={1.6} />

      <path d="M72,202 C60,190 56,168 66,148 C82,116 112,88 144,66 C154,59 163,54 170,50 C161,63 149,79 136,101 C112,138 88,168 76,196 Z" />
      <path d="M92,178 L112,150" strokeWidth={2} />
      <path d="M108,156 L126,130" strokeWidth={2} />
      <path d="M124,134 L140,110" strokeWidth={2} />

      <path d="M170,50 C160,28 150,14 138,4" />
      <path d="M170,50 C176,26 184,10 194,8" />
      <path d="M170,50 C182,32 198,20 210,10" />

      <circle cx="182" cy="168" r="26" />
      <path d="M182,142 C178,128 182,116 190,108" />
      <path d="M182,142 C190,130 200,124 210,122" />
    </g>
  );
}
