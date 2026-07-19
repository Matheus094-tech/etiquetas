import { useState } from "react";
import type { RefObject } from "react";
import type { LabelData } from "../label/label.types";
import { createFilename } from "../utils/createFilename";
import { exportLabelToPng } from "../utils/exportPng";
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
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isValid = Boolean(data.name.trim()) && Boolean(normalizeWeight(data.weight));

  const handleDownloadPng = async () => {
    if (!svgRef.current || !isValid) return;
    setIsExportingPng(true);
    setStatus({ kind: "idle" });
    try {
      await exportLabelToPng(svgRef.current, createFilename(data, "png"));
      onExported(data);
      setStatus({ kind: "success", message: "PNG baixado com sucesso." });
    } catch {
      setStatus({
        kind: "error",
        message: "Não foi possível gerar o PNG. Tente novamente.",
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current || !isValid) return;
    downloadSvg(svgRef.current, createFilename(data, "svg"));
    onExported(data);
    setStatus({ kind: "success", message: "SVG baixado com sucesso." });
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
        <button
          type="button"
          className="button button--primary"
          onClick={handleDownloadPng}
          disabled={!isValid || isExportingPng}
        >
          {isExportingPng ? "Gerando PNG…" : "Baixar PNG"}
        </button>
        <button
          type="button"
          className="button"
          onClick={handleDownloadSvg}
          disabled={!isValid}
        >
          Baixar SVG
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
