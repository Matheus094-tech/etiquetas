import { useState } from "react";
import type { RefObject } from "react";
import type { LabelData } from "../label/label.types";
import { createFilename } from "../utils/createFilename";
import { exportLabelToPng, PNG_EXPORT_PRESETS } from "../utils/exportPng";
import { downloadSvg } from "../utils/exportSvg";
import { normalizeWeight } from "../utils/normalizeWeight";

interface ExportActionsProps {
  data: LabelData;
  svgRef: RefObject<SVGSVGElement | null>;
  onClear: () => void;
  onDuplicate: () => void;
  onExported: (data: LabelData) => void;
}

type Status = { kind: "idle" } | { kind: "success"; message: string } | { kind: "error"; message: string };

export function ExportActions({ data, svgRef, onClear, onDuplicate, onExported }: ExportActionsProps) {
  const [exportingDpi, setExportingDpi] = useState<number | null>(null);
  const [isExportingSvg, setIsExportingSvg] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isValid = Boolean(data.name.trim()) && Boolean(normalizeWeight(data.weight));
  const isExporting = exportingDpi !== null || isExportingSvg;

  const handleDownloadPng = async (preset: (typeof PNG_EXPORT_PRESETS)[number]) => {
    if (!svgRef.current || !isValid) return;
    setExportingDpi(preset.dpi);
    setStatus({ kind: "idle" });
    try {
      await exportLabelToPng(svgRef.current, createFilename(data, "png", `${preset.dpi}dpi`), preset);
      onExported(data);
      setStatus({ kind: "success", message: `PNG (${preset.dpi} DPI) baixado com sucesso.` });
    } catch {
      setStatus({
        kind: "error",
        message: "Não foi possível gerar o PNG. Tente novamente.",
      });
    } finally {
      setExportingDpi(null);
    }
  };

  const handleDownloadSvg = async () => {
    if (!svgRef.current || !isValid) return;
    setIsExportingSvg(true);
    setStatus({ kind: "idle" });
    try {
      await downloadSvg(svgRef.current, createFilename(data, "svg"));
      onExported(data);
      setStatus({ kind: "success", message: "SVG baixado com sucesso." });
    } catch {
      setStatus({
        kind: "error",
        message: "Não foi possível gerar o SVG. Tente novamente.",
      });
    } finally {
      setIsExportingSvg(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Limpar o formulário e voltar aos valores iniciais?")) {
      onClear();
      setStatus({ kind: "idle" });
    }
  };

  const handleDuplicate = () => {
    if (!data.name.trim()) return;
    onDuplicate();
    setStatus({ kind: "success", message: "Configuração duplicada no histórico." });
  };

  return (
    <div className="export-actions">
      <div className="export-actions__buttons">
        {PNG_EXPORT_PRESETS.map((preset) => (
          <button
            key={preset.dpi}
            type="button"
            className="button button--primary"
            onClick={() => handleDownloadPng(preset)}
            disabled={!isValid || isExporting}
          >
            {exportingDpi === preset.dpi ? "Gerando…" : `Baixar PNG ${preset.dpi} DPI`}
          </button>
        ))}
        <button type="button" className="button" onClick={handleDownloadSvg} disabled={!isValid || isExporting}>
          {isExportingSvg ? "Gerando…" : "Baixar SVG"}
        </button>
        <button type="button" className="button" onClick={handleDuplicate} disabled={!data.name.trim()}>
          Duplicar
        </button>
        <button type="button" className="button button--ghost" onClick={handleClear}>
          Limpar
        </button>
      </div>

      {!isValid && (
        <p className="export-actions__hint">
          Preencha nome e peso para habilitar a exportação.
        </p>
      )}

      {status.kind !== "idle" && (
        <p
          className={`export-actions__status export-actions__status--${status.kind}`}
          role="status"
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
