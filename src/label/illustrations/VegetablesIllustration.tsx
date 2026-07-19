import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

/** Carrot, turnip and radish sprigs, in dense vintage engraving line style. */
export function VegetablesIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="veg-clip-carrot">
          <path d="M72,202 C60,190 56,168 66,148 C82,116 112,88 144,66 C154,59 163,54 170,50 C161,63 149,79 136,101 C112,138 88,168 76,196 Z" />
        </clipPath>
        <clipPath id="veg-clip-turnip">
          <circle cx="182" cy="168" r="26" />
        </clipPath>
        <clipPath id="veg-clip-radish">
          <ellipse cx="46" cy="196" rx="19" ry="16" />
        </clipPath>
      </defs>

      <HatchLines x={56} y={50} width={120} height={155} clipPathId="veg-clip-carrot" spacing={8} angle={128} strokeWidth={1.6} />
      <HatchLines x={56} y={50} width={120} height={155} clipPathId="veg-clip-carrot" spacing={13} angle={40} strokeWidth={1} opacity={0.55} />

      <path d="M72,202 C60,190 56,168 66,148 C82,116 112,88 144,66 C154,59 163,54 170,50 C161,63 149,79 136,101 C112,138 88,168 76,196 Z" />
      <path
        d="M78,196 C68,186 65,168 74,150 C89,121 116,95 145,73"
        strokeWidth={1.4}
        opacity={0.7}
      />
      <path d="M92,178 L112,150" strokeWidth={2} />
      <path d="M100,190 L118,164" strokeWidth={1.6} />
      <path d="M108,156 L126,130" strokeWidth={2} />
      <path d="M116,142 L132,118" strokeWidth={1.6} />
      <path d="M124,134 L140,110" strokeWidth={2} />
      <path d="M132,120 L146,98" strokeWidth={1.6} />

      <path d="M170,50 C160,28 150,14 138,4" />
      <path d="M170,50 C176,26 184,10 194,8" />
      <path d="M170,50 C182,32 198,20 210,10" />
      <path d="M164,54 C168,38 168,26 164,14" strokeWidth={1.6} opacity={0.7} />

      <HatchLines x={156} y={142} width={52} height={52} clipPathId="veg-clip-turnip" spacing={6} angle={100} strokeWidth={1.4} />
      <HatchLines x={156} y={142} width={52} height={52} clipPathId="veg-clip-turnip" spacing={10} angle={20} strokeWidth={0.9} opacity={0.5} />
      <circle cx="182" cy="168" r="26" />
      <path d="M182,142 C178,128 182,116 190,108" />
      <path d="M182,142 C190,130 200,124 210,122" />
      <path d="M176,144 C172,134 174,126 180,120" strokeWidth={1.4} opacity={0.7} />

      <HatchLines x={27} y={180} width={38} height={32} clipPathId="veg-clip-radish" spacing={6} angle={70} strokeWidth={1.2} />
      <ellipse cx="46" cy="196" rx="19" ry="16" />
      <path d="M46,180 C42,170 44,162 50,156" strokeWidth={1.6} />
      <path d="M40,182 C37,174 38,168 42,162" strokeWidth={1.2} opacity={0.7} />
      <path d="M33,192 L27,188" strokeWidth={1.4} />
      <path d="M35,204 L30,210" strokeWidth={1.4} />
    </g>
  );
}
