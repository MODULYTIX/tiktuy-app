// shared/components/repartidor/RegistrarRepartidor.tsx
import React from 'react';

interface Props {
  onClose: () => void;
}

export default function PanelControlRegistroRepartidor({ onClose }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A237E] mb-1 flex items-center gap-2">
        <span className="icon-[mdi--store-plus-outline]" />
        REGISTRAR NUEVO REPARTIDOR
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Completa el formulario para registrar un nuevo repartidor en la plataforma. Esta
        información permitirá habilitar su perfil logístico, monitorear sus entregas y garantizar una
        correcta operación durante el proceso de distribución.
      </p>

      <form className="grid grid-cols-2 gap-4">
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Alvaro" />
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Maguiña" />

        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Motorista" />
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. 756432189" />

        <div className="flex items-center gap-2">
          <span className="text-sm">+51</span>
          <input className="border px-3 py-2 rounded text-sm w-full" placeholder="Ejem. 987654321" />
        </div>
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. correo@gmail.com" />

        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. Hyundai" />
        <input className="border px-3 py-2 rounded text-sm" placeholder="Ejem. ADV-835" />
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
