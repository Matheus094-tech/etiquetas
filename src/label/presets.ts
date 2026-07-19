import type { LabelData } from "./label.types";

export interface LabelPreset {
  id: string;
  label: string;
  data: LabelData;
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: "patinho-moido-690g",
    label: "Patinho moído 690g",
    data: { name: "Patinho", description: "moído", weight: "690", illustration: "auto" },
  },
  {
    id: "legumes-489g",
    label: "Legumes 489g",
    data: { name: "Legumes", description: "", weight: "489", illustration: "auto" },
  },
  {
    id: "batata-patinho-560g",
    label: "Batata/Patinho 560g",
    data: { name: "Batata/Patinho", description: "", weight: "560", illustration: "auto" },
  },
  {
    id: "legumes-475g",
    label: "Legumes 475g",
    data: { name: "Legumes", description: "", weight: "475", illustration: "auto" },
  },
];
