// src/shared/hooks/useUbigeo.ts
import { useCallback, useEffect, useMemo, useState } from "react";

export type UbigeoDistrito = {
  code: string;   // código ubigeo (010101, etc.)
  name: string;   // nombre del distrito
  dep: string;    // departamento
  prov: string;   // provincia
};

export function useUbigeo() {
  const [items, setItems] = useState<UbigeoDistrito[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://free.e-api.net.pe/ubigeos.json");
        if (!res.ok) throw new Error("No se pudo cargar ubigeos");

        const raw = (await res.json()) as any;
        const tmp: UbigeoDistrito[] = [];

        for (const depName of Object.keys(raw)) {
          const provinciasObj = raw[depName];
          for (const provName of Object.keys(provinciasObj)) {
            const distritosObj = provinciasObj[provName];
            for (const distName of Object.keys(distritosObj)) {
              const meta = distritosObj[distName];
              tmp.push({
                dep: depName,
                prov: provName,
                name: distName,
                code: meta.ubigeo ?? "",
              });
            }
          }
        }

        if (!cancelled) setItems(tmp);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error cargando ubigeos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const departamentos = useMemo(
    () => Array.from(new Set(items.map((i) => i.dep))).sort(),
    [items]
  );

  const getProvincias = useCallback(
    (dep: string) =>
      Array.from(
        new Set(items.filter((i) => i.dep === dep).map((i) => i.prov))
      ).sort(),
    [items]
  );

  const getDistritos = useCallback(
    (dep: string, prov: string): UbigeoDistrito[] =>
      items
        .filter((i) => i.dep === dep && i.prov === prov)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  // 👉 útil como fallback cuando no hay datos de la sede
  const getAllDistritos = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return {
    departamentos,
    getProvincias,
    getDistritos,
    getAllDistritos,
    loading,
    error,
  };
}
