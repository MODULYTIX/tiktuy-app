// shared/components/ecommerce/RegistrarEcommerce.tsx
import React from 'react';

interface Props {
  onClose: () => void;
}

export default function PanelControlRegistroEcommerce({ onClose }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A237E] mb-1 flex items-center gap-2">
        <span className="icon-[mdi--store-plus-outline]" />
        REGISTRAR NUEVO ECOMMERCE
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Completa el formulario para registrar un nuevo ecommerce en la plataforma, garantizando
        su integración adecuada al sistema para futuras operaciones, gestiones y monitoreos.
      </p>

      <form className="grid grid-cols-2 gap-4">
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Alvaro" />
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Maguiña" />

        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. 87654321" />
        <input className="border px-3 py-2 rounded text-sm" placeholder="correo@gmail.com" />

        <div className="flex items-center gap-2">
          <span className="text-sm">+51</span>
          <input className="border px-3 py-2 rounded text-sm w-full" placeholder="Ejem. 987654321" />
        </div>
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. ElectroSur" />

        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. 10234567891" />
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Arequipa" />

        <input className="border px-3 py-2 rounded text-sm col-span-2" placeholder="Ejem. Av. Belgrano" />
        <input className="border px-3 py-2 rounded text-sm col-span-2" placeholder="Ejem. Electricidad" />
      </form>

      <div className="mt-6 flex justify-end gap-3">
        <button className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm">Crear nuevo</button>
        <button onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-gray-100">
          Cancelar
        </button>
      </div>
    </div>
  );
}
