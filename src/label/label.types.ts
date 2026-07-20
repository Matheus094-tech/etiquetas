/** Manual illustration choices exposed in the form — "auto" resolves at render time from the name/description. */
export type IllustrationKey =
  | "auto"
  | "legumes"
  | "carne-moida"
  | "carne-com-batata"
  | "batata-patinho"
  | "fruta-coloral"
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
  { value: "legumes", label: "Legumes" },
  { value: "carne-moida", label: "Carne moída" },
  { value: "carne-com-batata", label: "Carne com batata" },
  { value: "batata-patinho", label: "Batata/Patinho" },
  { value: "fruta-coloral", label: "Fruta / Coloral" },
  { value: "none", label: "Sem ilustração" },
];

export const EMPTY_LABEL_DATA: LabelData = {
  name: "",
  description: "",
  weight: "",
  illustration: "auto",
};
