/** Static M&S template and illustration catalog, all bundled locally. */
export const TEMPLATE_BASE_URL = "/assets/template/etiqueta-base-40x12mm.png";
export const TEMPLATE_OVERLAY_URL = "/assets/template/moldura-overlay-40x12mm.png";
export const LOGO_URL = "/assets/brand/logo-ms.png";

export type ResolvedIllustrationId =
  | "carne-com-batata"
  | "batata-patinho"
  | "carne-moida"
  | "legumes"
  | "fruta-coloral"
  | "frango"
  | "carne-bovina"
  | "arroz"
  | "feijao"
  | "cafe"
  | "acucar"
  | "macarrao"
  | "sal"
  | "leite"
  | "default";

export const ILLUSTRATION_ASSET_URLS: Record<ResolvedIllustrationId, string> = {
  "carne-com-batata": "/assets/illustrations/carne-com-batata.png",
  "batata-patinho": "/assets/illustrations/batata-patinho.png",
  "carne-moida": "/assets/illustrations/carne-moida.png",
  legumes: "/assets/illustrations/legumes.png",
  "fruta-coloral": "/assets/illustrations/fruta-coloral.png",
  frango: "/assets/illustrations/frango.svg",
  "carne-bovina": "/assets/illustrations/carne-bovina.svg",
  arroz: "/assets/illustrations/arroz.svg",
  feijao: "/assets/illustrations/feijao.svg",
  cafe: "/assets/illustrations/cafe.svg",
  acucar: "/assets/illustrations/acucar.svg",
  macarrao: "/assets/illustrations/macarrao.svg",
  sal: "/assets/illustrations/sal.svg",
  leite: "/assets/illustrations/leite.svg",
  default: "/assets/illustrations/default-ornamento.png",
};
