/** Manual selection, or automatic detection from product name/description. */
export type IllustrationKey =
  | "auto"
  | "legumes"
  | "carne-moida"
  | "carne-com-batata"
  | "batata-patinho"
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
  | "none";

export interface LabelData {
  name: string;
  description: string;
  weight: string;
  illustration: IllustrationKey;
}

export interface HistoryEntry extends LabelData {
  id: string;
  createdAt: string;
}

export const ILLUSTRATION_OPTIONS: { value: IllustrationKey; label: string }[] = [
  { value: "auto", label: "Automática" },
  { value: "frango", label: "Frango" },
  { value: "carne-bovina", label: "Carne bovina" },
  { value: "carne-moida", label: "Carne moída" },
  { value: "carne-com-batata", label: "Carne com batata" },
  { value: "batata-patinho", label: "Batata/Patinho" },
  { value: "arroz", label: "Arroz" },
  { value: "feijao", label: "Feijão" },
  { value: "cafe", label: "Café" },
  { value: "acucar", label: "Açúcar" },
  { value: "macarrao", label: "Macarrão" },
  { value: "sal", label: "Sal" },
  { value: "leite", label: "Leite" },
  { value: "legumes", label: "Legumes" },
  { value: "fruta-coloral", label: "Fruta / Coloral" },
  { value: "none", label: "Sem ilustração" },
];

export const EMPTY_LABEL_DATA: LabelData = {
  name: "",
  description: "",
  weight: "",
  illustration: "auto",
};
