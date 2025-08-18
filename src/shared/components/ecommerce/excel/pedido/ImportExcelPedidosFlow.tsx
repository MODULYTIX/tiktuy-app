// src/shared/components/ecommerce/excel/pedido/ImportExcelPedidosFlow.tsx
import React, { useRef, useState } from 'react';

//  Usamos el MISMO tipo que espera el Modal

// Mantiene tu misma API (no cambiamos lógica ni endpoint)

import ImportLoadingModal from '../ImportLoadingModal';
import ImportPreviewPedidosModal from './ImportPreviewPedidosModal';
import { previewVentasExcel } from '@/services/ecommerce/importexcelPedido/importexcelPedido.api';
import type { PreviewResponseDTO } from '@/services/ecommerce/importexcelPedido/importexcelPedido.type';

export default function ImportExcelPedidosFlow({
  token,
  onImported = () => {},
  children,
  allowMultiCourier = true, // <-- NUEVO: habilita flujo multi-courier
}: {
  token: string;
  onImported?: () => void;
  children: (openPicker: () => void) => React.ReactNode;
  allowMultiCourier?: boolean;
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
      // Endpoint de preview (conservamos tu misma llamada)
      const data = (await previewVentasExcel(file, token)) as PreviewResponseDTO;
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
          allowMultiCourier={allowMultiCourier}
        />
      )}
    </>
  );
}
