import { describe, expect, it } from "vitest";
import type { HistoryEntry, LabelData } from "../label/label.types";
import {
  MAX_HISTORY_ENTRIES,
  addToHistory,
  createHistoryEntry,
  parseHistory,
  removeFromHistory,
  serializeHistory,
} from "./historyStorage";

const sampleData: LabelData = {
  name: "Legumes",
  description: "",
  weight: "489",
  illustration: "auto",
};

const validEntry: HistoryEntry = {
  ...sampleData,
  id: "entry-1",
  createdAt: "2026-07-19T10:00:00.000Z",
};

describe("createHistoryEntry", () => {
  it("stores the label data plus a generated id and timestamp", () => {
    const entry = createHistoryEntry(sampleData);
    expect(entry.name).toBe(sampleData.name);
    expect(entry.description).toBe(sampleData.description);
    expect(entry.weight).toBe(sampleData.weight);
    expect(entry.illustration).toBe(sampleData.illustration);
    expect(typeof entry.id).toBe("string");
    expect(entry.id.length).toBeGreaterThan(0);
    expect(() => new Date(entry.createdAt).toISOString()).not.toThrow();
  });

  it("handles an empty description without leaving it undefined", () => {
    const entry = createHistoryEntry({ ...sampleData, description: "" });
    expect(entry.description).toBe("");
  });
});

describe("serializeHistory / parseHistory", () => {
  it("round-trips a list of entries through JSON", () => {
    const serialized = serializeHistory([validEntry]);
    expect(parseHistory(serialized)).toEqual([validEntry]);
  });

  it("returns an empty array for null input", () => {
    expect(parseHistory(null)).toEqual([]);
  });

  it("returns an empty array for malformed JSON", () => {
    expect(parseHistory("{not-json")).toEqual([]);
  });

  it("returns an empty array when the JSON is not an array", () => {
    expect(parseHistory(JSON.stringify({ foo: "bar" }))).toEqual([]);
  });

  it("discards entries with an invalid shape instead of crashing", () => {
    const raw = JSON.stringify([validEntry, { name: "incompleto" }, null, 42]);
    expect(parseHistory(raw)).toEqual([validEntry]);
  });

  it("caps serialization at MAX_HISTORY_ENTRIES", () => {
    const many: HistoryEntry[] = Array.from({ length: MAX_HISTORY_ENTRIES + 5 }, (_, index) => ({
      ...validEntry,
      id: `entry-${index}`,
    }));
    const parsed = parseHistory(serializeHistory(many));
    expect(parsed).toHaveLength(MAX_HISTORY_ENTRIES);
  });
});

describe("addToHistory", () => {
  it("prepends the new entry so the most recent label comes first", () => {
    const result = addToHistory([validEntry], sampleData);
    expect(result).toHaveLength(2);
    expect(result[0].id).not.toBe(validEntry.id);
    expect(result[1]).toEqual(validEntry);
  });

  it("keeps only the most recent MAX_HISTORY_ENTRIES entries", () => {
    const existing: HistoryEntry[] = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, index) => ({
      ...validEntry,
      id: `entry-${index}`,
    }));
    const result = addToHistory(existing, sampleData);
    expect(result).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(result[MAX_HISTORY_ENTRIES - 1].id).not.toBe(`entry-${MAX_HISTORY_ENTRIES - 1}`);
  });
});

describe("removeFromHistory", () => {
  it("removes only the entry with the matching id", () => {
    const other: HistoryEntry = { ...validEntry, id: "entry-2" };
    const result = removeFromHistory([validEntry, other], validEntry.id);
    expect(result).toEqual([other]);
  });

  it("returns the list unchanged when the id is not found", () => {
    const result = removeFromHistory([validEntry], "missing-id");
    expect(result).toEqual([validEntry]);
  });
});
