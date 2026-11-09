import { triggerDownload } from "./download";
import { embedSvgImages } from "./embedSvgImages";
import { serializeSvgElement } from "./exportSvg";
import { LABEL_DIMENSIONS } from "../label/layout";

const MM_PER_INCH = 25.4;
const mmToPx = (mm: number, dpi: number) => Math.round((mm / MM_PER_INCH) * dpi);

export interface PngExportPreset {
  dpi: number;
  width: number;
  height: number;
}

/** Export sizes are derived from the exact physical label, including 203-DPI thermal printers. */
export const PNG_EXPORT_PRESETS: readonly PngExportPreset[] = [203, 300, 600].map((dpi) => ({
  dpi,
  width: mmToPx(LABEL_DIMENSIONS.widthMm, dpi),
  height: mmToPx(LABEL_DIMENSIONS.heightMm, dpi),
}));

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar o SVG para conversão em PNG."));
    image.src = url;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar o arquivo PNG."));
    }, "image/png");
  });
}

export async function exportLabelToPng(
  svg: SVGSVGElement,
  filename: string,
  preset: PngExportPreset
): Promise<void> {
  const embedded = await embedSvgImages(svg);
  const svgString = serializeSvgElement(embedded);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível criar o contexto de desenho para exportação.");

    // Opaque white paper, fully consistent with thermal printing.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await canvasToPngBlob(canvas);
    const pngUrl = URL.createObjectURL(pngBlob);
    try {
      triggerDownload(pngUrl, filename);
    } finally {
      URL.revokeObjectURL(pngUrl);
    }
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
