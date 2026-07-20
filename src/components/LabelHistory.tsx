import type { HistoryEntry } from "../label/label.types";
import { formatWeightLabel } from "../utils/normalizeWeight";

interface LabelHistoryProps {
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDuplicate: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatEntrySummary(entry: HistoryEntry): string {
  const weight = formatWeightLabel(entry.weight);
  return [entry.description, weight].filter(Boolean).join("  •  ");
}

export function LabelHistory({ entries, onLoad, onDuplicate, onRemove, onClearAll }: LabelHistoryProps) {
  return (
    <section className="label-history" aria-labelledby="label-history-heading">
      <div className="label-history__header">
        <h2 id="label-history-heading">Histórico recente</h2>
        {entries.length > 0 && (
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => {
              if (window.confirm("Limpar todo o histórico de etiquetas?")) onClearAll();
            }}
          >
            Limpar histórico
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="label-history__empty">Nenhuma etiqueta gerada ainda.</p>
      ) : (
        <ul className="label-history__list">
          {entries.map((entry) => (
            <li key={entry.id} className="label-history__item">
              <div className="label-history__info">
                <span className="label-history__name">{entry.name || "(sem nome)"}</span>
                <span className="label-history__meta">{formatEntrySummary(entry)}</span>
                <span className="label-history__date">{dateFormatter.format(new Date(entry.createdAt))}</span>
              </div>
              <div className="label-history__actions">
                <button type="button" className="button button--small" onClick={() => onLoad(entry)}>
                  Carregar
                </button>
                <button type="button" className="button button--small" onClick={() => onDuplicate(entry)}>
                  Duplicar
                </button>
                <button
                  type="button"
                  className="button button--small button--ghost"
                  onClick={() => onRemove(entry.id)}
                  aria-label={`Excluir etiqueta ${entry.name} do histórico`}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
