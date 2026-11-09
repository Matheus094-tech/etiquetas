import { ILLUSTRATION_OPTIONS, type IllustrationKey, type HistoryEntry, type LabelData } from "../label/label.types";

export const HISTORY_STORAGE_KEY = "gerador-etiquetas-ms:history";
export const MAX_HISTORY_ENTRIES = 10;

const ILLUSTRATION_KEYS = new Set<IllustrationKey>(ILLUSTRATION_OPTIONS.map((option) => option.value));

function isIllustrationKey(value: unknown): value is IllustrationKey {
  return typeof value === "string" && ILLUSTRATION_KEYS.has(value as IllustrationKey);
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.description === "string" &&
    typeof entry.weight === "string" &&
    typeof entry.createdAt === "string" &&
    isIllustrationKey(entry.illustration)
  );
}

export function createHistoryEntry(data: LabelData): HistoryEntry {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return { ...data, id, createdAt: new Date().toISOString() };
}

export function serializeHistory(entries: HistoryEntry[]): string {
  return JSON.stringify(entries.slice(0, MAX_HISTORY_ENTRIES));
}

export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

export function addToHistory(entries: HistoryEntry[], data: LabelData): HistoryEntry[] {
  const nextEntry = createHistoryEntry(data);
  return [nextEntry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
}

export function removeFromHistory(entries: HistoryEntry[], id: string): HistoryEntry[] {
  return entries.filter((entry) => entry.id !== id);
}
