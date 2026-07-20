import { triggerDownload } from "./download";
import { embedSvgImages } from "./embedSvgImages";
import { serializeSvgElement } from "./exportSvg";

const MM_PER_INCH = 25.4;
const LABEL_WIDTH_MM = 40;
const LABEL_HEIGHT_MM = 12;

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export interface PngExportPreset {
  dpi: number;
  width: number;
  height: number;
}

/** The two print resolutions required for the 40mm x 12mm label — a one-pixel rounding difference from the exact 10:3 ratio is expected and acceptable. */
export const PNG_EXPORT_PRESETS: readonly PngExportPreset[] = [
  { dpi: 300, width: mmToPx(LABEL_WIDTH_MM, 300), height: mmToPx(LABEL_HEIGHT_MM, 300) },
  { dpi: 600, width: mmToPx(LABEL_WIDTH_MM, 600), height: mmToPx(LABEL_HEIGHT_MM, 600) },
];

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

/**
 * Rasterizes the label into a transparent PNG at the requested print
 * resolution and triggers a browser download. The template, logo and
 * illustration `<image>` references are embedded as data URLs first so the
 * rasterization never depends on a live fetch to the site.
 */
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
    if (!ctx) {
      throw new Error("Não foi possível criar o contexto de desenho para exportação.");
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
