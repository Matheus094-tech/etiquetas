import type { RefObject } from "react";
import { VintageLabel } from "../label/VintageLabel";
import type { LabelData } from "../label/label.types";

interface LabelPreviewProps {
  data: LabelData;
  svgRef: RefObject<SVGSVGElement | null>;
}

/**
 * Renders the live label preview over a checkerboard backdrop so the user
 * can see which areas are transparent. The checkerboard is CSS only — it is
 * never part of the SVG tree, so it never leaks into an exported file.
 */
export function LabelPreview({ data, svgRef }: LabelPreviewProps) {
  return (
    <div className="label-preview">
      <div className="label-preview__checkerboard">
        <VintageLabel
          ref={svgRef}
          name={data.name}
          description={data.description}
          weight={data.weight}
          illustration={data.illustration}
          className="label-preview__svg"
        />
      </div>
      <p className="label-preview__hint">
        O padrão quadriculado indica apenas, nesta pré-visualização, onde a etiqueta será
        transparente — ele não faz parte do arquivo exportado.
      </p>
    </div>
  );
}
