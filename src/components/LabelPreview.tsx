import type { RefObject } from "react";
import { VintageLabel } from "../label/VintageLabel";
import type { LabelData } from "../label/label.types";

interface LabelPreviewProps {
  data: LabelData;
  svgRef: RefObject<SVGSVGElement | null>;
}

/** The exact SVG used for downloads is displayed here, at its physical aspect ratio. */
export function LabelPreview({ data, svgRef }: LabelPreviewProps) {
  return (
    <div className="label-preview">
      <div className="label-preview__checkerboard">
        <div className="label-preview__frame">
          <VintageLabel
            ref={svgRef}
            name={data.name}
            description={data.description}
            weight={data.weight}
            illustration={data.illustration}
            className="label-preview__svg"
          />
        </div>
      </div>
      <p className="label-preview__hint">
        Prévia proporcional de 40 × 12 mm. A impressão deve usar tamanho real (100%),
        sem ajustar à página; escolha o PNG na resolução da sua impressora.
      </p>
    </div>
  );
}
