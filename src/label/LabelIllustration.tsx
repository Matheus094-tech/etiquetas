import type { IllustrationKey } from "./label.types";
import { BeansIllustration } from "./illustrations/BeansIllustration";
import { ChickenIllustration } from "./illustrations/ChickenIllustration";
import { GroundBeefIllustration } from "./illustrations/GroundBeefIllustration";
import { PotatoBeefIllustration } from "./illustrations/PotatoBeefIllustration";
import { RiceIllustration } from "./illustrations/RiceIllustration";
import { VegetablesIllustration } from "./illustrations/VegetablesIllustration";

/** Native content size every illustration is authored against. */
const ILLUSTRATION_VIEWBOX = 240;

const ILLUSTRATION_COMPONENTS: Partial<Record<IllustrationKey, () => React.JSX.Element>> = {
  vegetables: VegetablesIllustration,
  "ground-beef": GroundBeefIllustration,
  "potato-beef": PotatoBeefIllustration,
  chicken: ChickenIllustration,
  rice: RiceIllustration,
  beans: BeansIllustration,
};

interface LabelIllustrationProps {
  illustration: IllustrationKey;
  x: number;
  y: number;
  width: number;
  height: number;
  clipId: string;
}

/** Positions the resolved illustration inside its slot on the label, clipped so hand-authored artwork never bleeds past the panel. */
export function LabelIllustration({ illustration, x, y, width, height, clipId }: LabelIllustrationProps) {
  const Illustration = ILLUSTRATION_COMPONENTS[illustration];
  if (!Illustration) return null;

  const scale = Math.min(width, height) / ILLUSTRATION_VIEWBOX;
  const offsetX = x + (width - ILLUSTRATION_VIEWBOX * scale) / 2;
  const offsetY = y + (height - ILLUSTRATION_VIEWBOX * scale) / 2;

  return (
    <g clipPath={`url(#${clipId})`}>
      <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
        <Illustration />
      </g>
    </g>
  );
}
