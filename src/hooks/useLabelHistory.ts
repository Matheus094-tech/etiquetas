import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry, LabelData } from "../label/label.types";
import {
  HISTORY_STORAGE_KEY,
  addToHistory,
  parseHistory,
  removeFromHistory,
  serializeHistory,
} from "../utils/historyStorage";

function readHistoryFromStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return parseHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
}

function writeHistoryToStorage(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(entries));
}

interface UseLabelHistoryResult {
  entries: HistoryEntry[];
  addEntry: (data: LabelData) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

/** Keeps the last generated labels in localStorage — only the data needed to rebuild them, never the rendered image. */
export function useLabelHistory(): UseLabelHistoryResult {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => readHistoryFromStorage());

  useEffect(() => {
    writeHistoryToStorage(entries);
  }, [entries]);

  const addEntry = useCallback((data: LabelData) => {
    setEntries((current) => addToHistory(current, data));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => removeFromHistory(current, id));
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, removeEntry, clearHistory };
}
