import type { RefObject } from "react";
import type { LabelData } from "../label/label.types";
import { ExportActions } from "./ExportActions";
import { LabelForm } from "./LabelForm";
import { LabelPreview } from "./LabelPreview";

interface LabelEditorProps {
  data: LabelData;
  onChange: (data: LabelData) => void;
  svgRef: RefObject<SVGSVGElement | null>;
  onClear: () => void;
  onDuplicate: () => void;
  onExported: (data: LabelData) => void;
}

export function LabelEditor({ data, onChange, svgRef, onClear, onDuplicate, onExported }: LabelEditorProps) {
  return (
    <section className="label-editor" aria-label="Editor de etiqueta">
      <div className="label-editor__form">
        <LabelForm data={data} onChange={onChange} />
      </div>
      <div className="label-editor__preview">
        <LabelPreview data={data} svgRef={svgRef} />
        <ExportActions
          data={data}
          svgRef={svgRef}
          onClear={onClear}
          onDuplicate={onDuplicate}
          onExported={onExported}
        />
      </div>
    </section>
  );
}
