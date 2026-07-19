import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

/** Potatoes paired with a mound of ground meat and a sprig of herbs, dense vintage engraving line style. */
export function PotatoBeefIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="potato-clip-1">
          <path d="M45,150 C28,140 25,113 45,97 C63,82 92,84 101,103 C116,111 112,140 92,154 C76,164 58,161 45,150 Z" />
        </clipPath>
        <clipPath id="potato-clip-2">
          <path d="M115,205 C100,197 98,176 115,164 C130,152 154,154 161,169 C173,176 169,199 152,209 C139,217 125,214 115,205 Z" />
        </clipPath>
        <clipPath id="potato-clip-mound">
          <path d="M120,95 C116,78 128,64 146,64 C162,64 174,76 170,92 C182,100 178,117 162,124 C144,132 118,126 116,110 C114,102 116,98 120,95 Z" />
        </clipPath>
      </defs>

      <HatchLines x={25} y={82} width={91} height={82} clipPathId="potato-clip-1" spacing={7} angle={30} strokeWidth={1.4} />
      <HatchLines x={25} y={82} width={91} height={82} clipPathId="potato-clip-1" spacing={12} angle={110} strokeWidth={0.9} opacity={0.5} />
      <path d="M45,150 C28,140 25,113 45,97 C63,82 92,84 101,103 C116,111 112,140 92,154 C76,164 58,161 45,150 Z" />
      <path d="M50,144 C38,134 37,116 50,104" strokeWidth={1.3} opacity={0.65} />
      <circle cx="63" cy="112" r="2.6" fill={INK} stroke="none" />
      <circle cx="82" cy="130" r="2.6" fill={INK} stroke="none" />
      <circle cx="80" cy="104" r="2.6" fill={INK} stroke="none" />
      <circle cx="55" cy="128" r="2" fill={INK} stroke="none" />
      <path d="M60,109 C62,107 65,107 67,109" strokeWidth={1} />
      <path d="M79,127 C81,125 84,125 86,127" strokeWidth={1} />

      <HatchLines x={98} y={152} width={71} height={65} clipPathId="potato-clip-2" spacing={7} angle={150} strokeWidth={1.4} />
      <HatchLines x={98} y={152} width={71} height={65} clipPathId="potato-clip-2" spacing={12} angle={70} strokeWidth={0.9} opacity={0.5} />
      <path d="M115,205 C100,197 98,176 115,164 C130,152 154,154 161,169 C173,176 169,199 152,209 C139,217 125,214 115,205 Z" />
      <path d="M119,199 C108,190 107,176 118,167" strokeWidth={1.3} opacity={0.65} />
      <circle cx="130" cy="188" r="2.4" fill={INK} stroke="none" />
      <circle cx="148" cy="196" r="2.4" fill={INK} stroke="none" />
      <circle cx="141" cy="174" r="2" fill={INK} stroke="none" />

      <HatchLines x={114} y={64} width={68} height={68} clipPathId="potato-clip-mound" spacing={6} angle={60} strokeWidth={1.4} />
      <HatchLines x={114} y={64} width={68} height={68} clipPathId="potato-clip-mound" spacing={10} angle={150} strokeWidth={0.9} opacity={0.5} />
      <path d="M120,95 C116,78 128,64 146,64 C162,64 174,76 170,92 C182,100 178,117 162,124 C144,132 118,126 116,110 C114,102 116,98 120,95 Z" />
      <path d="M128,92 C125,79 134,68 148,68" strokeWidth={1.3} opacity={0.65} />
      <path d="M132,95 C130,90 134,86 139,87 C144,88 146,93 142,97 C138,101 133,100 132,95 Z" strokeWidth={1.6} />
      <path d="M150,80 C148,75 152,71 157,72 C162,73 164,78 160,82 C156,86 151,85 150,80 Z" strokeWidth={1.6} />
      <path d="M143,110 C141,105 145,101 150,102 C155,103 157,108 153,112 C149,116 145,115 143,110 Z" strokeWidth={1.4} />

      <g strokeWidth={1.6} opacity={0.85}>
        <path d="M182,164 C188,148 192,132 190,116" />
        {[
          { at: 0.15, angle: -35 },
          { at: 0.32, angle: 30 },
          { at: 0.48, angle: -32 },
          { at: 0.62, angle: 34 },
          { at: 0.78, angle: -28 },
          { at: 0.92, angle: 26 },
        ].map((leaflet, index) => {
          const px = 182 - leaflet.at * 8;
          const py = 164 - leaflet.at * 48;
          return (
            <path
              key={index}
              d={`M${px},${py} q${leaflet.angle > 0 ? 10 : -10},-4 ${leaflet.angle > 0 ? 14 : -14},-10`}
              strokeWidth={1.3}
            />
          );
        })}
      </g>
    </g>
  );
}
