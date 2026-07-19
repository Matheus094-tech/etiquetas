export type IllustrationKey =
  | "auto"
  | "vegetables"
  | "ground-beef"
  | "potato-beef"
  | "chicken"
  | "rice"
  | "beans"
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
  { value: "vegetables", label: "Legumes" },
  { value: "ground-beef", label: "Carne moída" },
  { value: "potato-beef", label: "Batata com carne" },
  { value: "chicken", label: "Frango" },
  { value: "rice", label: "Arroz" },
  { value: "beans", label: "Feijão" },
  { value: "none", label: "Sem ilustração" },
];

export const EMPTY_LABEL_DATA: LabelData = {
  name: "",
  description: "",
  weight: "",
  illustration: "auto",
};
