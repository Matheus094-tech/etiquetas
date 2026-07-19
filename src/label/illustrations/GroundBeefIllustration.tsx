import { HatchLines } from "./HatchLines";

const INK = "#1a1a1a";

/** A generous mound of ground meat on a plate, dense vintage engraving line style. */
export function GroundBeefIllustration() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="beef-clip-mound">
          <path d="M50,186 C43,152 58,122 90,111 C97,89 122,79 142,94 C167,83 193,101 186,127 C202,142 196,167 175,180 C150,197 88,197 50,186 Z" />
        </clipPath>
        <clipPath id="beef-clip-plate">
          <ellipse cx="120" cy="196" rx="88" ry="16" />
        </clipPath>
      </defs>

      <HatchLines x={32} y={180} width={176} height={32} clipPathId="beef-clip-plate" spacing={7} angle={10} strokeWidth={1} opacity={0.5} />
      <ellipse cx="120" cy="196" rx="88" ry="16" />
      <ellipse cx="120" cy="194" rx="70" ry="11" strokeWidth={1.4} opacity={0.7} />

      <HatchLines x={43} y={79} width={160} height={120} clipPathId="beef-clip-mound" spacing={7} angle={55} strokeWidth={1.5} />
      <HatchLines x={43} y={79} width={160} height={120} clipPathId="beef-clip-mound" spacing={11} angle={140} strokeWidth={1} opacity={0.55} />

      <path d="M50,186 C43,152 58,122 90,111 C97,89 122,79 142,94 C167,83 193,101 186,127 C202,142 196,167 175,180 C150,197 88,197 50,186 Z" />
      <path
        d="M58,178 C53,150 65,126 92,116 C98,97 119,88 137,100"
        strokeWidth={1.4}
        opacity={0.65}
      />

      <path d="M78,140 C74,132 78,124 87,122 C95,120 102,126 100,135 C98,143 88,148 80,145 Z" strokeWidth={2} />
      <path d="M118,120 C114,111 120,103 130,103 C139,103 144,111 140,119 C136,127 124,129 118,120 Z" strokeWidth={2} />
      <path d="M150,140 C148,131 155,124 165,125 C174,126 178,135 172,142 C166,149 154,148 150,140 Z" strokeWidth={2} />
      <path d="M105,165 C103,157 109,151 118,152 C126,153 130,161 124,167 C118,173 108,172 105,165 Z" strokeWidth={2} />
      <path d="M64,158 C62,151 67,146 74,147 C81,148 84,154 79,159 C74,164 66,164 64,158 Z" strokeWidth={1.8} />
      <path d="M140,160 C138,153 143,148 150,149 C157,150 160,156 155,161 C150,166 142,166 140,160 Z" strokeWidth={1.8} />

      <path d="M85,132 L92,140" strokeWidth={1.2} opacity={0.7} />
      <path d="M125,112 L132,120" strokeWidth={1.2} opacity={0.7} />
      <path d="M158,133 L165,141" strokeWidth={1.2} opacity={0.7} />
      <path d="M112,160 L119,168" strokeWidth={1.2} opacity={0.7} />
    </g>
  );
}
