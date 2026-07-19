import { triggerDownload } from "./download";
import { serializeSvgElement } from "./exportSvg";

export const MIN_EXPORT_WIDTH_PX = 2400;

export interface ExportPngOptions {
  /** Explicit scale factor applied to the SVG's own viewBox units. */
  scale?: number;
  /** Minimum output width in pixels; used to derive a scale when `scale` is omitted. */
  minWidthPx?: number;
}

function getViewBoxSize(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.viewBox.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }
  return {
    width: svg.width.baseVal.value || svg.clientWidth,
    height: svg.height.baseVal.value || svg.clientHeight,
  };
}

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
 * Rasterizes the given SVG label into a transparent, high-resolution PNG and
 * triggers a browser download. Runs entirely client-side: the SVG is loaded
 * as an image and drawn onto a canvas sized for the requested resolution, so
 * the vector artwork stays sharp instead of being naively upscaled.
 */
export async function exportLabelToPng(
  svg: SVGSVGElement,
  filename: string,
  options: ExportPngOptions = {}
): Promise<void> {
  const { width, height } = getViewBoxSize(svg);
  if (width <= 0 || height <= 0) {
    throw new Error("Não foi possível determinar as dimensões da etiqueta.");
  }

  const scale = options.scale ?? Math.max(1, (options.minWidthPx ?? MIN_EXPORT_WIDTH_PX) / width);

  const svgString = serializeSvgElement(svg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

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
