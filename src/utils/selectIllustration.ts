import type { IllustrationKey } from "../label/label.types";
import { stripAccents } from "./text";

/**
 * Resolves which illustration should be rendered. Manual selections always
 * win; "auto" inspects the food name for keywords.
 */
export function selectIllustration(
  name: string,
  manualSelection: IllustrationKey
): IllustrationKey {
  if (manualSelection !== "auto") return manualSelection;
  return detectIllustrationFromName(name);
}

export function detectIllustrationFromName(name: string): IllustrationKey {
  const normalized = stripAccents(name).toLowerCase();

  const hasPotato = /\bbatatas?\b/.test(normalized);
  const hasBeef = /\b(patinho|carnes?|moid[ao]s?)\b/.test(normalized);
  const hasVegetables = /\b(legumes?|verduras?)\b/.test(normalized);
  const hasChicken = /\bfrangos?\b/.test(normalized);
  const hasRice = /\barroz\b/.test(normalized);
  const hasBeans = /\bfeijao\b/.test(normalized);

  if (hasPotato && hasBeef) return "potato-beef";
  if (hasVegetables) return "vegetables";
  if (hasBeef) return "ground-beef";
  if (hasChicken) return "chicken";
  if (hasRice) return "rice";
  if (hasBeans) return "beans";
  return "none";
}
