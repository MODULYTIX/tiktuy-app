import { Icon } from '@iconify/react';
import React from 'react';

interface Props {
  onClose: () => void;
}

export default function PanelControlRegistroEcommerce({ onClose }: Props) {
  return (
    <div>
      {/* Título */}
      <div className="flex items-center gap-2 mb-2">
        <Icon icon="mdi:store-plus" className="text-[#1A237E]" />
        <h2 className="text-lg font-bold text-[#1A237E] uppercase">
          Registrar Nuevo Ecommerce
        </h2>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-6">
        Completa el formulario para registrar un nuevo ecommerce en la plataforma, garantizando su
        integración adecuada al sistema para futuras operaciones, gestiones y monitoreos.
      </p>

      {/* Formulario */}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Nombre</label>
          <input type="text" placeholder="Ejem. Alvaro" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Apellido</label>
          <input type="text" placeholder="Ejem. Maguiña" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">DNI / CI</label>
          <input type="text" placeholder="Ejem. 87654321" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Correo</label>
          <input type="email" placeholder="correo@gmail.com" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Teléfono</label>
          <div className="flex items-center gap-2">
            <span className="px-2 py-2 border rounded text-sm bg-gray-100">+51</span>
            <input type="text" placeholder="Ejem. 987654321" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Nombre Comercial</label>
          <input type="text" placeholder="Ejem. Electrosur" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">RUC</label>
          <input type="text" placeholder="Ejem. 10234567891" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Ciudad</label>
          <input type="text" placeholder="Ejem. Arequipa" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Dirección</label>
          <input type="text" placeholder="Ejem. Av. Belgrano" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Rubro</label>
          <input type="text" placeholder="Ejem. Electricidad" className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </form>

      {/* Botones */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm hover:bg-[#0d174f] transition">
          Crear nuevo
        </button>
        <button
          onClick={onClose}
          className="border px-4 py-2 rounded text-sm hover:bg-gray-100 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
