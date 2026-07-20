import { useCallback, useRef, useState } from "react";
import { LabelEditor } from "./components/LabelEditor";
import { LabelHistory } from "./components/LabelHistory";
import { PresetList } from "./components/PresetList";
import { useLabelHistory } from "./hooks/useLabelHistory";
import { EMPTY_LABEL_DATA, type HistoryEntry, type LabelData } from "./label/label.types";
import "./styles/App.css";

function toLabelData(entry: HistoryEntry): LabelData {
  return {
    name: entry.name,
    description: entry.description,
    weight: entry.weight,
    illustration: entry.illustration,
  };
}

export default function App() {
  const [data, setData] = useState<LabelData>(EMPTY_LABEL_DATA);
  const svgRef = useRef<SVGSVGElement>(null);
  const { entries, addEntry, removeEntry, clearHistory } = useLabelHistory();

  const handleClear = useCallback(() => {
    setData(EMPTY_LABEL_DATA);
  }, []);

  const handleDuplicateToHistory = useCallback(() => {
    if (!data.name.trim()) return;
    addEntry(data);
  }, [addEntry, data]);

  const handleExported = useCallback(
    (exportedData: LabelData) => {
      addEntry(exportedData);
    },
    [addEntry]
  );

  const handleHistoryLoad = useCallback((entry: HistoryEntry) => {
    setData(toLabelData(entry));
  }, []);

  const handleHistoryDuplicate = useCallback(
    (entry: HistoryEntry) => {
      const duplicated = toLabelData(entry);
      setData(duplicated);
      addEntry(duplicated);
    },
    [addEntry]
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark" aria-hidden="true">
            M&amp;S
          </span>
          <div>
            <h1>Gerador de Etiquetas M&amp;S</h1>
            <p>Etiquetas de cozinha vintage, geradas na hora, direto no navegador.</p>
          </div>
        </div>
      </header>

      <main className="app__main">
        <PresetList onSelect={setData} />

        <LabelEditor
          data={data}
          onChange={setData}
          svgRef={svgRef}
          onClear={handleClear}
          onDuplicate={handleDuplicateToHistory}
          onExported={handleExported}
        />

        <LabelHistory
          entries={entries}
          onLoad={handleHistoryLoad}
          onDuplicate={handleHistoryDuplicate}
          onRemove={removeEntry}
          onClearAll={clearHistory}
        />
      </main>

      <footer className="app__footer">
        <p>Desenvolvido por MB Software</p>
      </footer>
    </div>
  );
}
