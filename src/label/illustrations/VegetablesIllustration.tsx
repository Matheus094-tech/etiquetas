import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

const BROCCOLI_SILHOUETTE =
  "M160,26 C150,24 142,32 144,42 C136,44 132,54 138,62 C132,68 132,78 140,83 C138,90 144,96 152,94 C157,100 167,100 172,94 C180,98 188,94 188,86 C196,86 200,78 196,70 C202,64 200,54 192,50 C194,42 188,34 178,34 C178,26 168,22 160,26 Z";

const BROCCOLI_TEXTURE: { x: number; y: number; r: number }[] = [
  { x: 158, y: 38, r: 9 },
  { x: 174, y: 34, r: 8 },
  { x: 187, y: 42, r: 8 },
  { x: 149, y: 50, r: 8 },
  { x: 165, y: 46, r: 9 },
  { x: 180, y: 52, r: 8 },
  { x: 193, y: 58, r: 7 },
  { x: 156, y: 62, r: 8 },
  { x: 172, y: 60, r: 8 },
  { x: 185, y: 66, r: 7 },
  { x: 164, y: 74, r: 7 },
  { x: 178, y: 78, r: 6 },
];

/** Broccoli, carrot, onion and a shelled pea pod — a fuller still life, dense vintage engraving line style. */
export function VegetablesIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="veg-clip-carrot">
          <path d="M92,208 C80,196 76,174 86,154 C102,122 128,98 156,78 C164,72 171,68 176,65 C168,77 158,91 146,111 C124,146 102,174 96,202 Z" />
        </clipPath>
        <clipPath id="veg-clip-onion">
          <circle cx="42" cy="202" r="24" />
        </clipPath>
        <clipPath id="veg-clip-broccoli">
          <path d={BROCCOLI_SILHOUETTE} />
        </clipPath>
      </defs>

      {/* broccoli */}
      <g>
        <HatchLines x={132} y={22} width={70} height={78} clipPathId="veg-clip-broccoli" spacing={6} angle={35} strokeWidth={1} opacity={0.4} />
        <path d={BROCCOLI_SILHOUETTE} fill="#ffffff" strokeWidth={2.6} />
        {BROCCOLI_TEXTURE.map((bump, index) => (
          <circle key={index} cx={bump.x} cy={bump.y} r={bump.r} strokeWidth={1.4} />
        ))}
        <path d="M162,86 C160,96 158,104 162,114" strokeWidth={2.2} />
        <path d="M178,88 C180,96 180,104 176,114" strokeWidth={2.2} />
        <path d="M170,90 L172,116" strokeWidth={2.2} />
      </g>

      {/* carrot */}
      <HatchLines x={76} y={65} width={110} height={143} clipPathId="veg-clip-carrot" spacing={8} angle={128} strokeWidth={1.6} />
      <HatchLines x={76} y={65} width={110} height={143} clipPathId="veg-clip-carrot" spacing={13} angle={40} strokeWidth={1} opacity={0.55} />
      <path d="M92,208 C80,196 76,174 86,154 C102,122 128,98 156,78 C164,72 171,68 176,65 C168,77 158,91 146,111 C124,146 102,174 96,202 Z" />
      <path
        d="M98,202 C88,192 85,174 94,156 C109,127 132,103 158,82"
        strokeWidth={1.4}
        opacity={0.7}
      />
      <path d="M110,184 L128,158" strokeWidth={2} />
      <path d="M124,164 L140,140" strokeWidth={2} />
      <path d="M138,144 L152,122" strokeWidth={2} />

      {/* onion, tucked to the lower-left, clear of the carrot */}
      <HatchLines x={18} y={178} width={48} height={48} clipPathId="veg-clip-onion" spacing={6} angle={100} strokeWidth={1.3} />
      <circle cx="42" cy="202" r="24" />
      <path d="M42,180 C37,189 37,197 42,202 C47,197 47,189 42,180 Z" strokeWidth={1.4} opacity={0.7} />
      <path d="M28,202 C28,192 34,183 42,180" strokeWidth={1.3} opacity={0.6} />
      <path d="M42,179 C40,171 41,165 45,159" strokeWidth={1.8} />
      <path d="M26,224 L21,229" strokeWidth={1.6} />
      <path d="M33,226 L30,232" strokeWidth={1.6} />
      <path d="M42,225 L42,233" strokeWidth={1.6} />

      {/* pea pod */}
      <g strokeWidth={2}>
        <path d="M150,196 C148,178 158,164 176,160 C194,156 208,164 210,178 C212,192 200,202 184,204 C168,206 152,206 150,196 Z" />
        <circle cx="166" cy="188" r="7" strokeWidth={1.6} />
        <circle cx="180" cy="184" r="7" strokeWidth={1.6} />
        <circle cx="194" cy="182" r="7" strokeWidth={1.6} />
        <path d="M152,196 C160,192 168,196 176,192" strokeWidth={1.2} opacity={0.6} />
      </g>
      <circle cx="132" cy="216" r="6" strokeWidth={1.6} />
      <circle cx="148" cy="223" r="6" strokeWidth={1.6} />
      <circle cx="118" cy="225" r="5" strokeWidth={1.6} />
    </g>
  );
}
