// src/shared/components/admin/panel/modals/ModalConfirmAsociar.tsx
import { Icon } from '@iconify/react';

type Props = {
  open: boolean;
  loading?: boolean;
  passwordSetupUrl?: string | null;
  onCopy?: () => void;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ModalConfirmAsociar({
  open,
  loading = false,
  passwordSetupUrl,
  onCopy,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  const associated = !!passwordSetupUrl;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Icon icon="mdi:help-circle-outline" width={32} className="text-blue-700" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
              {associated ? 'Courier Asociado' : 'Registrar Courier'}
            </h3>

            {!associated ? (
              <>
                <ul className="text-sm text-gray-700 text-left mx-auto max-w-[320px] list-disc list-inside space-y-1 mb-6">
                  <li>Almacenamiento de tu Stock.</li>
                  <li>Servicio de entrega y cobro para el día siguiente.</li>
                  <li>Estado de entrega en tiempo real.</li>
                </ul>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm hover:brightness-110 disabled:opacity-60"
                  >
                    {loading ? 'Asociando…' : 'Asociar'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  Enlace de activación generado. Compártelo con el courier:
                </p>
                <div className="flex items-center gap-2 bg-gray-50 border rounded px-3 py-2 text-left">
                  <span className="text-xs break-all select-all">{passwordSetupUrl}</span>
                  <button
                    onClick={onCopy}
                    className="ml-auto p-1 rounded hover:bg-gray-100"
                    title="Copiar"
                  >
                    <Icon icon="mdi:content-copy" width={18} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm hover:brightness-110"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
