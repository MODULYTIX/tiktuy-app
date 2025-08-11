import React, { useRef, useState } from 'react';
import type { PreviewResponseDTO } from '@/services/ecommerce/importExcel/importexcel.type';
import { previewVentasExcel } from '@/services/ecommerce/importExcel/importexcel.api';
import ImportLoadingModal from '../ImportLoadingModal';
import ImportPreviewPedidosModal from './ImportPreviewPedidosModal';

export default function ImportExcelPedidosFlow({
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
  const [previewData, setPreviewData] = useState<PreviewResponseDTO | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingModalOpen(true);
    try {
      // Endpoint de preview de PEDIDOS (ya lo tienes configurado)
      const data = await previewVentasExcel(file, token);
      setPreviewData(data);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar la previsualización del Excel de pedidos.');
    } finally {
      setLoadingModalOpen(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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
        open={loadingModalOpen}
        onClose={() => setLoadingModalOpen(false)}
        label="Validando datos del Excel…"
      />

      {previewData && (
        <ImportPreviewPedidosModal
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
