// src/shared/components/admin/panel/modals/ModalConfirmDesasociar.tsx
import { Icon } from '@iconify/react';

type Props = {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ModalConfirmDesasociar({ open, onConfirm, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon icon="mdi:alert-circle-outline" width={32} className="text-red-700" />
            </div>
            <h3 className="text-xl font-semibold mb-2">¿Deseas desasociar la cuenta?</h3>
            <p className="text-sm text-gray-700 mb-6">
              Una vez desasociada, el usuario no tendrá acceso al panel hasta ser reasociado.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:brightness-110"
              >
                Sí, desasociar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
