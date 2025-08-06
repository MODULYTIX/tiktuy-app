// components/shared/InvitarModal.tsx
import { Icon } from '@iconify/react';

interface InvitarModalProps {
  onClose: () => void;
  activeTab: 'ecommerce' | 'motorizado';
}

export default function PanelControlInvitacion({ onClose, activeTab }: InvitarModalProps) {
  const enlace = 'https://imax-ecommerce.web.app/';

  const handleCopy = () => {
    navigator.clipboard.writeText(enlace);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-30" onClick={() => onClose()}>
      <div className="bg-white rounded-lg p-6 w-[480px]">
        <h2 className="text-xl font-bold text-center text-[#1A237E] mb-2">
          <Icon icon="mdi:share-outline" className="inline mr-2" />
          Compartir
        </h2>

        <p className="text-center text-sm text-gray-600 mb-4">
          Invita a otros {activeTab === 'ecommerce' ? 'ecommerces' : 'repartidores'} a unirse a nuestra plataforma compartiendo este enlace.
        </p>

        <div className="flex justify-center gap-6 mb-4 text-center items-center">
          <div className='flex flex-col items-center h-full'>
            <Icon icon="logos:whatsapp-icon" width="36" />
            <p className="text-xs mt-1">Whatsapp</p>
          </div>
          <div className='flex flex-col items-center h-full'>
            <Icon icon="logos:facebook" width="36" />
            <p className="text-xs mt-1">Facebook</p>
          </div>
          <div className='flex flex-col items-center h-full'>
            <Icon icon="logos:google-gmail" width="36" />
            <p className="text-xs mt-3">Gmail</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded">
          <span className="text-sm text-gray-700 truncate">{enlace}</span>
          <button
            onClick={handleCopy}
            className="text-sm font-medium text-white bg-[#1A237E] px-3 py-1 rounded"
          >
            Copiar
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}