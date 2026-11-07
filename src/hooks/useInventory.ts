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

  // As URLs são privadas e expiram; renová-las evita imagens quebradas após 10 min.
  const photoPathsKey = items.map((item) => item.photo_path).filter(Boolean).join("|");
  useEffect(() => {
    let active = true;
    const paths = Array.from(new Set(photoPathsKey.split("|").filter(Boolean)));
    async function updateSignedUrls() {
      const rows = await Promise.all(paths.map(async (path) => {
        try { return [path, await signedProductPhoto(path)] as const; }
        catch { return null; }
      }));
      if (!active) return;
      setPhotoUrls(Object.fromEntries(rows.filter(
        (row): row is readonly [string, string] => row !== null
      )));
    }
    void updateSignedUrls();
    const id = window.setInterval(() => { void updateSignedUrls(); }, 8 * 60_000);
    window.addEventListener("focus", updateSignedUrls);
    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener("focus", updateSignedUrls);
    };
  }, [photoPathsKey]);

  return { items, locations, photoUrls, loading, error, reload };
}
