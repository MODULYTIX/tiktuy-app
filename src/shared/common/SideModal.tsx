import React, { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

export default function SideModal({
  title,
  children,
  onClose,
  width = 'max-w-7xl',
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full sm:w-auto ${width} bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Cerrar">
            <HiX size={18} />
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-48px)]">{children}</div>
      </div>
    </div>
  );
}
