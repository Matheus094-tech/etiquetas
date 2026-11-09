import type { ResolvedIllustrationId } from "../label/assets";
import type { IllustrationKey } from "../label/label.types";
import { cleanLabelName } from "./cleanLabelName";
import { stripAccents } from "./text";

/** Word-based matching avoids accidental substring matches such as SAL/SALSICHA. */
function words(value: string): string[] {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function detect(text: string): ResolvedIllustrationId | null {
  const terms = new Set(words(text));
  const has = (...options: string[]) => options.some((option) => terms.has(option));
  const normal = words(text).join(" ");

  if (/\bbatata patinho\b/.test(normal)) return "batata-patinho";
  if (has("batata") && has("carne", "patinho", "bovina", "boi")) return "carne-com-batata";
  if (has("frango", "galinha", "chicken")) return "frango";
  if (has("moida", "moido") && has("carne", "patinho", "bovina")) return "carne-moida";
  if (has("patinho")) return "carne-moida"; // retain legacy patinho presets
  if (has("carne", "bovina", "boi", "bife", "alcatra", "picanha", "contra", "file")) return "carne-bovina";
  if (has("arroz")) return "arroz";
  if (has("feijao", "feijoes")) return "feijao";
  if (has("cafe")) return "cafe";
  if (has("acucar")) return "acucar";
  if (has("macarrao", "massa", "espaguete", "penne")) return "macarrao";
  if (has("sal")) return "sal";
  if (has("leite", "lacteo", "condensado")) return "leite";
  if (has("legume", "legumes", "verdura", "verduras", "vegetal", "vegetais")) return "legumes";
  if (has("fruta", "frutas", "coloral", "urucum", "banana", "maca", "morango", "uva", "mamao")) return "fruta-coloral";
  return null;
}

/** Name takes precedence over description to avoid misillustrating the product. */
export function detectIllustrationFromName(name: string, description = ""): ResolvedIllustrationId {
  return detect(cleanLabelName(name)) ?? detect(description) ?? "default";
}

export function selectIllustration(
  name: string,
  description: string,
  manualSelection: IllustrationKey
): ResolvedIllustrationId | "none" {
  if (manualSelection !== "auto") return manualSelection;
  return detectIllustrationFromName(name, description);
}
