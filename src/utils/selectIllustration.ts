import type { ResolvedIllustrationId } from "../label/assets";
import type { IllustrationKey } from "../label/label.types";
import { stripAccents } from "./text";

/** Lowercases, strips accents and collapses everything but letters/digits/slash/space into single spaces. */
function normalize(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CARNE_COM_BATATA_TERMS = ["carne", "patinho", "bovina", "boi"];
const CARNE_MOIDA_TERMS = ["carne", "patinho", "moido", "moida", "bovina", "boi"];
const LEGUMES_TERMS = ["legume", "legumes", "verdura", "verduras", "vegetal", "vegetais"];
const FRUTA_COLORAL_TERMS = [
  "fruta",
  "frutas",
  "coloral",
  "urucum",
  "banana",
  "maca",
  "morango",
  "uva",
  "mamao",
];

/**
 * Detects which official illustration matches a food name (+ optional
 * description), following the rule order from the approved asset pack's
 * `illustration-map.example.ts`: specific rules (the batata/patinho phrase,
 * then the carne-com-batata combo) before the generic single-keyword ones.
 */
export function detectIllustrationFromName(name: string, description = ""): ResolvedIllustrationId {
  const text = normalize(`${name} ${description}`);
  const has = (term: string) => text.includes(normalize(term));

  if (has("batata/patinho") || has("batata patinho")) return "batata-patinho";
  if (has("batata") && CARNE_COM_BATATA_TERMS.some(has)) return "carne-com-batata";
  if (CARNE_MOIDA_TERMS.some(has)) return "carne-moida";
  if (LEGUMES_TERMS.some(has)) return "legumes";
  if (FRUTA_COLORAL_TERMS.some(has)) return "fruta-coloral";
  return "default";
}

/**
 * Resolves which illustration should be rendered. Manual selections always
 * win; "auto" inspects the food name and description for keywords.
 */
export function selectIllustration(
  name: string,
  description: string,
  manualSelection: IllustrationKey
): ResolvedIllustrationId | "none" {
  if (manualSelection !== "auto") return manualSelection;
  return detectIllustrationFromName(name, description);
}
