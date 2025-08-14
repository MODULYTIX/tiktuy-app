// shared/components/courier/almacen/AlmacenCourierTable.tsx
import { Icon } from "@iconify/react";
import type { AlmacenamientoCourier } from "@/services/courier/almacen/almacenCourier.type";

type Props = {
  items: AlmacenamientoCourier[];
  loading: boolean;
  error?: string;
  onView: (row: AlmacenamientoCourier) => void;
  onEdit: (row: AlmacenamientoCourier) => void;
};

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("es-PE");
  } catch {
    return iso;
  }
};

export default function AlmacenCourierTable({
  items,
  loading,
  error,
  onView,
  onEdit,
}: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">
        Cargando almacenes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-x-auto">
      <table className="min-w-full text-sm text-gray-800">
        <thead className="bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
          <tr>
            <th className="px-5 py-4 text-left">Nom. Almacén</th>
            <th className="px-5 py-4 text-left">Departamento</th>
            <th className="px-5 py-4 text-left">Ciudad</th>
            <th className="px-5 py-4 text-left">Dirección</th>
            <th className="px-5 py-4 text-left">F. Creación</th>
            <th className="px-5 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((almacen, index) => (
            <tr
              key={almacen.uuid}
              className={`border-b last:border-none ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-gray-100 transition-colors`}
            >
              <td className="px-5 py-4">{almacen.nombre_almacen}</td>
              <td className="px-5 py-4">{almacen.departamento}</td>
              <td className="px-5 py-4">{almacen.ciudad}</td>
              <td className="px-5 py-4">{almacen.direccion}</td>
              <td className="px-5 py-4">
                {formatDate(almacen.fecha_registro)}
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Ver"
                    onClick={() => onView(almacen)}
                  >
                    <Icon icon="uil:eye" width="20" height="20" />
                  </button>
                  <button
                    type="button"
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                    title="Editar"
                    onClick={() => onEdit(almacen)}
                  >
                    <Icon icon="uil:edit" width="20" height="20" />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td className="px-5 py-8 text-center text-gray-500" colSpan={6}>
                No hay almacenes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
