import { LABEL_PRESETS } from "../label/presets";
import type { LabelData } from "../label/label.types";

interface PresetListProps {
  onSelect: (data: LabelData) => void;
}

export function PresetList({ onSelect }: PresetListProps) {
  return (
    <section className="preset-list" aria-labelledby="preset-list-heading">
      <h2 id="preset-list-heading">Atalhos</h2>
      <div className="preset-list__buttons">
        {LABEL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="button button--outline"
            onClick={() => onSelect({ ...preset.data })}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
}
