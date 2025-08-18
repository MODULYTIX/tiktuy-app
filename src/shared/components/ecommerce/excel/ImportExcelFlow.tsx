import React, { useRef, useState } from 'react';
import ImportLoadingModal from './ImportLoadingModal';
import type { PreviewProductosResponseDTO } from '@/services/ecommerce/importExcelProducto/importexcel.type';
import { previewProductosExcel } from '@/services/ecommerce/importExcelProducto/importexcel.api';
import ImportProductosPreviewModal from './producto/ImportPreviewModal';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import type { Option } from '@/shared/common/Autocomplete';

type Phase = 'idle' | 'loading' | 'preview';

export default function ImportExcelFlow({
  token,
  onImported = () => {},
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

  const openPicker = () => inputRef.current?.click();

  const toOptions = <T extends Record<string, unknown>, K extends keyof T>(
    arr: T[],
    key: K
  ): Option[] => {
    const names = new Set<string>();
    (arr ?? []).forEach((it) => {
      const v = String(it?.[key] ?? '').trim(); // ← cambio clave
      if (v) names.add(v);
    });
    return Array.from(names).map((n) => ({ value: n, label: n }));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewData(null);
    setAlmacenOptions(null);
    setCategoriaOptions(null);
    setPhase('loading');

    try {
      const [preview, almacenes, categorias] = await Promise.all([
        previewProductosExcel(file, token),
        fetchAlmacenes(token),
        fetchCategorias(token),
      ]);

      setPreviewData(preview);
      setAlmacenOptions(toOptions<Almacenamiento>(almacenes as any, 'nombre_almacen'));
      setCategoriaOptions(toOptions<Categoria>(categorias as any, 'nombre'));

      // cerrar loader y abrir preview
      setPhase('idle');
      const t = setTimeout(() => setPhase('preview'), 0);
      return () => clearTimeout(t);
    } catch (err) {
      console.error('[ImportExcelFlow] Error en preview/maestros:', err);
      alert('No se pudo generar la previsualización del Excel de productos.');
      setPreviewData(null);
      setPhase('idle');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const closePreview = () => {
    setPhase('idle');
    setPreviewData(null);
  };

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
          open
          onClose={closePreview}
          token={token}
          data={previewData}
          onImported={() => {
            onImported();
            closePreview();
          }}
          preloadedAlmacenOptions={almacenOptions ?? []}
          preloadedCategoriaOptions={categoriaOptions ?? []}
        />
      )}
    </>
  );
}
