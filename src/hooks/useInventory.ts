import { useCallback, useEffect, useState } from "react";
import {
  getInventory, getLocations, signedProductPhoto,
  type InventoryItem, type Location,
} from "../lib/casaApi";

export function useInventory(houseId: string) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [inventory, places] = await Promise.all([
        getInventory(houseId), getLocations(houseId),
      ]);
      setItems(inventory);
      setLocations(places);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar o estoque.");
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void reload(true);
    // Sincronização leve entre celulares, sem exigir websocket/realtime neste MVP.
    const id = window.setInterval(() => { void reload(); }, 20_000);
    const onFocus = () => { void reload(); };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  useEffect(() => {
    let active = true;
    const paths = Array.from(new Set(items.map((item) => item.photo_path).filter(
      (path): path is string => Boolean(path)
    )));
    void Promise.all(paths.map(async (path) => {
      try { return [path, await signedProductPhoto(path)] as const; }
      catch { return null; }
    })).then((rows) => {
      if (!active) return;
      setPhotoUrls(Object.fromEntries(rows.filter(
        (row): row is readonly [string, string] => row !== null
      )));
    });
    return () => { active = false; };
  }, [items.map((item) => item.photo_path).join("|")]);

  return { items, locations, photoUrls, loading, error, reload };
}
