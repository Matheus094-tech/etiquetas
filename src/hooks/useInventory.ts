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

  // As fotos são baixadas por endpoint autenticado. URLs temporárias do navegador
  // precisam ser revogadas para não acumular imagens em memória.
  const photoPathsKey = items.map((item) => item.photo_path).filter(Boolean).join("|");
  useEffect(() => {
    let active = true;
    const allocated = new Set<string>();
    const paths = Array.from(new Set(photoPathsKey.split("|").filter(Boolean)));

    async function loadPhotos() {
      const rows = await Promise.all(paths.map(async (path) => {
        try { return [path, await signedProductPhoto(path)] as const; }
        catch { return null; }
      }));
      const urls = rows.filter((row): row is readonly [string, string] => row !== null);
      if (!active) {
        for (const [, url] of urls) URL.revokeObjectURL(url);
        return;
      }
      const previousUrls = Array.from(allocated);
      allocated.clear();
      for (const [, url] of urls) allocated.add(url);
      setPhotoUrls(Object.fromEntries(urls));
      window.setTimeout(() => previousUrls.forEach(URL.revokeObjectURL), 50);
    }

    void loadPhotos();
    const onFocus = () => { void loadPhotos(); };
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      allocated.forEach(URL.revokeObjectURL);
    };
  }, [photoPathsKey]);

  return { items, locations, photoUrls, loading, error, reload };
}
