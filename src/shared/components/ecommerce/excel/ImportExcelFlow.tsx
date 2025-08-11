// src/components/excel/ImportExcelFlow.tsx
import React, { useRef, useState } from 'react';
import ImportLoadingModal from './ImportLoadingModal';
import ImportPreviewModal from './ImportPreviewModal';
import type { PreviewResponseDTO } from '@/services/ecommerce/importExcel/importexcel.type';
import { previewVentasExcel } from '@/services/ecommerce/importExcel/importexcel.api';

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
  const [loadingModalOpen, setLoadingModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponseDTO | null>(
    null
  );

  const openPicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // abrir modal de carga
    setLoadingModalOpen(true);
    try {
      const data = await previewVentasExcel(file, token);
      setPreviewData(data);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar la previsualización del Excel.');
    } finally {
      setLoadingModalOpen(false);
      // limpiar el input para permitir re-selección del mismo archivo
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Render prop: te paso openPicker para que lo llames en tu botón “Importar archivo” */}
      {children(openPicker)}

      {/* input escondido para abrir el file picker */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Modal de carga con 3 pelotitas */}
      <ImportLoadingModal
        open={loadingModalOpen}
        onClose={() => setLoadingModalOpen(false)}
        label="Validando datos del Excel…"
      />

      {/* Modal de preview/validación */}
      {previewData && (
        <ImportPreviewModal
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          token={token}
          data={previewData}
          onImported={onImported}
        />
      )}
    </>
  );
}
