import React, { useCallback, useRef, useState } from 'react';
import ImportLoadingModal from './ImportLoadingModal';
import type { PreviewProductosResponseDTO } from '@/services/ecommerce/importExcelProducto/importexcel.type';
import { previewProductosExcel } from '@/services/ecommerce/importExcelProducto/importexcel.api';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import ImportProductosPreviewModal from './producto/ImportPreviewModal';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import type { Option } from '@/shared/common/Autocomplete';

type Phase = 'idle' | 'loading' | 'preview';

export default function ImportExcelFlow({
  token,
  onImported = () => { },
  children,
}: {
  token: string;
  onImported?: () => void;
  children: (openPicker: () => void) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewData, setPreviewData] = useState<PreviewProductosResponseDTO | null>(null);

  // Opciones precargadas (evita 2º loader)
  const [almacenOptions, setAlmacenOptions] = useState<Option[] | null>(null);
  const [categoriaOptions, setCategoriaOptions] = useState<Option[] | null>(null);
  const [existingProductNames, setExistingProductNames] = useState<string[]>([]);

  const DEFAULT_CATEGORIES = [
    "Tecnología",
    "Hogar",
    "Moda",
    "Calzado",
    "Belleza",
    "Electrodomésticos",
    "Alimentos y bebidas",
    "Juguetes",
    "Deportes y fitness",
    "Libros/entretenimiento",
  ];

  /*
   * Transforma una lista de objetos en opciones únicas usando la clave `key`.
   * - Ordedas alfabéticamente (case-insensitive).
   */
  const toOptions = <T, K extends keyof T = keyof T>(
    arr: T[] | null | undefined,
    key: K
  ): Option[] => {
    const names = new Set<string>();
    for (const it of arr ?? []) {
      const raw = it[key];
      const v = (raw == null ? '' : String(raw)).trim();
      if (v) names.add(v);
    }
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'accent' }))
      .map((n) => ({ value: n, label: n }));
  };

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setPreviewData(null);
      setAlmacenOptions(null);
      setCategoriaOptions(null);
      setPhase('loading');

      try {
        console.debug('[IMPORT:PRODUCTOS] Iniciando previsualización desde Excel...');
        const [preview, almacenes, categorias, productosResp] = await Promise.all([
          previewProductosExcel(file, token),
          fetchAlmacenes(token),
          fetchCategorias(token),
          fetchProductos(token, { perPage: 2000, only_with_stock: false }), // Fetch para sugerencias
        ]);

        // Set datos de preview
        setPreviewData(preview);

        // Nombres de productos existentes para sugerencias
        const allProductNames = (productosResp.data || []).map(p => p.nombre_producto);
        setExistingProductNames(allProductNames);

        // Opciones únicas precargadas
        const optsAlm = toOptions<Almacenamiento>(almacenes as Almacenamiento[], 'nombre_almacen');

        const cats = categorias as Categoria[];
        let finalCategoryNames: string[] = [];

        if (cats && cats.length > 0) {
          const addedNames = new Set<string>();

          // A: Agregar DEFAULT_CATEGORIES (Orden Lógico)
          DEFAULT_CATEGORIES.forEach(defCat => {
            finalCategoryNames.push(defCat);
            addedNames.add(defCat.toLowerCase());
          });

          // B: Agregar las de BD que NO estén en DEFAULT (Orden Alfabético para el resto)
          const extraCats = cats
            .map(c => c.nombre.trim())
            .filter(name => !addedNames.has(name.toLowerCase()))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'accent' }));

          finalCategoryNames.push(...extraCats);
        } else {
          // Fallback a solo defaults
          finalCategoryNames = [...DEFAULT_CATEGORIES];
        }

        const optsCat = finalCategoryNames.map(name => ({ value: name, label: name }));

        setAlmacenOptions(optsAlm);
        setCategoriaOptions(optsCat);

        // cerrar loader y abrir preview
        setPhase('idle');
        const t = setTimeout(() => setPhase('preview'), 0);
        return () => clearTimeout(t);
      } catch (err) {
        console.error('[IMPORT:PRODUCTOS] Error en preview/maestros:', err);
        alert('No se pudo generar la previsualización del Excel de productos.');
        setPreviewData(null);
        setPhase('idle');
      } finally {
        // limpiar input para permitir re-subida del mismo archivo
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [token]
  );

  const closePreview = useCallback(() => {
    setPhase('idle');
    setPreviewData(null);
    setAlmacenOptions(null);
    setCategoriaOptions(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <>
      {children(openPicker)}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={onFileChange}
      />

      <ImportLoadingModal
        open={phase === 'loading'}
        onClose={() => setPhase('idle')}
        label="Validando datos del Excel…"
      />

      {phase === 'preview' && previewData && (
        <ImportProductosPreviewModal
          key={Date.now()}
          open
          onClose={closePreview}
          token={token}
          data={previewData}
          onImported={() => {
            try {
              onImported();
            } finally {
              closePreview();
            }
          }}
          preloadedAlmacenOptions={almacenOptions ?? []}
          preloadedCategoriaOptions={categoriaOptions ?? []}
          existingProductNames={existingProductNames}
        />
      )}

    </>
  );
}
