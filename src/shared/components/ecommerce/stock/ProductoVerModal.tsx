import { HiOutlineEye } from 'react-icons/hi';
import type { Producto } from '@/services/ecommerce/producto/producto.types';

type Props = {
  open: boolean;
  onClose: () => void;
  data: Producto | null;
};

export default function ProductoVerModal({ open, onClose, data }: Props) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-lg h-full p-6 overflow-y-auto">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HiOutlineEye />
          DETALLE DEL PRODUCTO
        </h2>
        <p className="text-sm text-gray-500 mt-1">Consulta todos los datos registrados de este producto.</p>

        <div className="mt-6 space-y-4 text-sm">
          <Field label="Código" value={String((data as any).codigo_identificacion ?? '')} />
          <Field label="Nombre" value={String((data as any).nombre_producto ?? '')} />
          <Field label="Descripción" value={String((data as any).descripcion ?? '')} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría" value={String((data as any).categoria?.descripcion ?? (data as any).categoria_id ?? '')} />
            <Field label="Almacén" value={String((data as any).almacenamiento?.nombre_almacen ?? (data as any).almacenamiento_id ?? '')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio" value={`S/ ${Number((data as any).precio ?? 0).toFixed(2)}`} />
            <Field label="Cantidad" value={String((data as any).stock ?? '')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock Mínimo" value={String((data as any).stock_minimo ?? '')} />
            <Field label="Peso" value={String((data as any).peso ?? '')} />
          </div>
          <Field label="Estado" value={String((data as any).estado?.nombre ?? '')} />
          <Field label="Fecha Registro" value={String((data as any).fecha_registro ?? '')} />
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="border px-4 py-2 text-sm rounded hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="border border-gray-200 rounded px-3 py-2">{value ?? ''}</div>
    </div>
  );
}
