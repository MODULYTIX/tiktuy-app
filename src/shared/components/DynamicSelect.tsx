import React from 'react';

interface Props {
  name: string;
  label: string;
  value: string;
  options: { id: number; nombre: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}

export default function DynamicSelect({
  name,
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar opción',
}: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
