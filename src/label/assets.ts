/**
 * URLs of the official M&S label assets (see `assets-manifest.json` in this
 * directory). These are the approved template, logo and illustrations —
 * served as static files from `public/assets/` and drawn as `<image>`
 * elements, never redrawn or reinterpreted as new artwork.
 */

export const TEMPLATE_BASE_URL = "/assets/template/etiqueta-base-40x12mm.png";
export const TEMPLATE_OVERLAY_URL = "/assets/template/moldura-overlay-40x12mm.png";
export const LOGO_URL = "/assets/brand/logo-ms.png";

/** Every illustration the official asset pack ships, including the generic fallback. */
export type ResolvedIllustrationId =
  | "carne-com-batata"
  | "batata-patinho"
  | "carne-moida"
  | "legumes"
  | "fruta-coloral"
  | "default";

export const ILLUSTRATION_ASSET_URLS: Record<ResolvedIllustrationId, string> = {
  "carne-com-batata": "/assets/illustrations/carne-com-batata.png",
  "batata-patinho": "/assets/illustrations/batata-patinho.png",
  "carne-moida": "/assets/illustrations/carne-moida.png",
  legumes: "/assets/illustrations/legumes.png",
  "fruta-coloral": "/assets/illustrations/fruta-coloral.png",
  default: "/assets/illustrations/default-ornamento.png",
};
