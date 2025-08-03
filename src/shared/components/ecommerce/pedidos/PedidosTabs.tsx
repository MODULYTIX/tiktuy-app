import { useState } from 'react';
import { RiAiGenerate } from 'react-icons/ri';
import { MdOutlineAssignment } from 'react-icons/md';
import { LuClipboardCheck } from 'react-icons/lu';

type Estado = 'generado' | 'asignado' | 'completado';

interface Props {
  onChange: (estado: Estado) => void;
}

export default function PedidosTabs({ onChange }: Props) {
  const [selected, setSelected] = useState<Estado>(
    () => (localStorage.getItem('ventas_estado') as Estado) || 'generado'
  );

  const handleClick = (estado: Estado) => {
    setSelected(estado);
    localStorage.setItem('ventas_estado', estado);
    onChange(estado);
  };

  const baseBtn = 'flex items-center gap-2 p-2 rounded-sm transition-colors';
  const isSelected = (estado: Estado) =>
    selected === estado
      ? 'bg-primaryDark text-white'
      : 'bg-gray-100 text-primaryDark';

  return (
    <div className="flex gap-2 items-center">
      <button className={`${baseBtn} ${isSelected('generado')}`} onClick={() => handleClick('generado')}>
        <RiAiGenerate size={18} />
        <span>Generado</span>
      </button>

      <button className={`${baseBtn} ${isSelected('asignado')}`} onClick={() => handleClick('asignado')}>
        <MdOutlineAssignment size={18} />
        <span>Asignado</span>
      </button>

      <button className={`${baseBtn} ${isSelected('completado')}`} onClick={() => handleClick('completado')}>
        <LuClipboardCheck size={18} />
        <span>Completado</span>
      </button>
    </div>
  );
}
