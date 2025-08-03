import { useState, useRef, useEffect } from 'react';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi';

interface Props {
  onTemplateClick: () => void;
  onImportClick: () => void;
}

export default function AnimatedExcelMenu({ onTemplateClick, onImportClick }: Props) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center" ref={ref}>
      {/* Botones deslizantes */}
      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'
        }`}
      >
        <button
          onClick={onTemplateClick}
          className="flex items-center gap-1 px-4 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200 transition"
        >
          <HiOutlineDownload size={16} />
          Descargar plantilla
        </button>
        <button
          onClick={onImportClick}
          className="flex items-center gap-1 px-4 py-2 rounded text-sm bg-green-600 text-white hover:bg-green-700 transition"
        >
          <HiOutlineUpload size={16} />
          Importar archivo
        </button>
      </div>

      {/* Separador */}
      <div
        className={`h-8 w-px bg-gray-300 mx-2 transition-all duration-300 ${
          show ? 'opacity-100' : 'opacity-0 w-0 mx-0'
        }`}
      />

      {/* Botón Excel */}
      <button
        onClick={() => setShow((prev) => !prev)}
        className="border px-3 py-[6px] rounded hover:bg-gray-100 transition"
      >
        <PiMicrosoftExcelLogoFill size={22} />
      </button>
    </div>
  );
}
