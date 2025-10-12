// src/shared/components/admin/panel/modals/ModalDetalleSolicitud.tsx
import type { SolicitudCourier } from '@/role/user/service/solicitud-courier.types';
import { Icon } from '@iconify/react';

type Props = {
  open: boolean;
  data: SolicitudCourier;
  onClose: () => void;
};

export default function ModalDetalleSolicitud({ open, data, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* drawer */}
      <div className="absolute top-0 right-0 h-full w-[560px] max-w-[92vw] bg-white shadow-xl flex flex-col">
        {/* header */}
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:clipboard-text-outline" width={22} className="text-blue-700" />
            <h3 className="text-lg font-semibold text-gray-800">
              Detalle de la solicitud de Courier
            </h3>
          </div>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={onClose}
            title="Cerrar"
          >
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto px-6 py-5 grid grid-cols-2 gap-5">
          {/* Columna izquierda */}
          <div className="flex flex-col gap-4">
            <Field label="Nombre" value={data.nombres ?? '—'} placeholder="Ejem. Alvaro" />
            <Field label="DNI / CI" value={data.dni_ci ?? '—'} placeholder="Ejem. 87654321" />
            <Field label="Correo" value={data.correo ?? '—'} placeholder="Ejem. correo@gmail.com" />
            <Field label="Ciudad" value={data.ciudad ?? '—'} placeholder="Seleccionar ciudad" />
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-4">
            <Field label="Apellido" value={(data.apellido_paterno || data.apellido_materno) ?? '—'} placeholder="Ejem. Maguiña" />
            <PhoneField label="Celular" value={data.telefono ?? ''} />
            <Field label="Nombre Comercial" value={data.courier ?? data.nombre_comercial ?? '—'} placeholder="Ejem. Electrosur" />
            <Field label="Dirección" value={data.direccion ?? '—'} placeholder="Ejem. Av. Belgrano" />
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, placeholder }: { label: string; value: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] text-gray-600">{label}</label>
      <input
        value={value || ''}
        disabled
        placeholder={placeholder}
        className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 text-gray-700"
      />
    </div>
  );
}

function PhoneField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] text-gray-600">{label}</label>
      <div className="h-10 rounded-md border border-gray-200 flex overflow-hidden bg-gray-50">
        <span className="px-2 flex items-center border-r border-gray-200 text-[12px] text-gray-600">
          +51
        </span>
        <input
          value={value || ''}
          disabled
          className="flex-1 px-2 text-sm bg-gray-50 text-gray-700"
        />
      </div>
    </div>
  );
}
