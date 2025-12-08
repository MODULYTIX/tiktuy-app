import React, { useRef, useState } from 'react';

import ImportLoadingModal from '../ImportLoadingModal';
import ImportPreviewPedidosModal from './ImportPreviewPedidosModal';
import { previewVentasExcel } from '@/services/ecommerce/importexcelPedido/importexcelPedido.api';
import type { PreviewResponseDTO } from '@/services/ecommerce/importexcelPedido/importexcelPedido.type';

export default function ImportExcelPedidosFlow({
  token,
  onImported = () => { },
  children,
  allowMultiCourier = true, // ← ya NO afecta nada, pero lo mantenemos por compatibilidad
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

  /* ===================== Abrir selector ===================== */
  const openPicker = () => {
    inputRef.current?.click();
  };

  /* ===================== Cargar archivo ===================== */
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingModalOpen(true);

    try {
      const data = await previewVentasExcel(file, token);
      setPreviewData(data as PreviewResponseDTO);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error('❌ Error preview Excel:', err);
      alert('No se pudo generar la previsualización del Excel de pedidos.');
    } finally {
      setLoadingModalOpen(false);
      if (inputRef.current) inputRef.current.value = ''; // limpiar input file
    }
  };

  return (
    <>
      {children(openPicker)}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Modal de carga */}
      <ImportLoadingModal
        open={loadingModalOpen}
        onClose={() => setLoadingModalOpen(false)}
        label="Validando datos del Excel…"
      />

      {/* Preview modal */}
      {previewData && (
        <ImportPreviewPedidosModal
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          token={token}
          data={previewData}
          onImported={onImported}
          allowMultiCourier={allowMultiCourier} // aunque ya no se usa, lo mantiene el componente
        />
      )}
    </>
  );
}
