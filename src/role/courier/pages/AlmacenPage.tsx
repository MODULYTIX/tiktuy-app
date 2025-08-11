import { Icon } from '@iconify/react';

export type Almacen = {
  id: number;
  nombre: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  fecha?: string;
};

type Props = {
  onVer?: (almacen: Almacen) => void;
  onEditar?: (almacen: Almacen) => void;
};

const almacenesMock: Almacen[] = [
  { id: 1, nombre: 'Almacén Central', departamento: 'Arequipa', ciudad: 'Camaná', direccion: 'Mariscal Cáceres', fecha: '12/01/2025' },
  { id: 2, nombre: 'Almacén Central', departamento: 'Lima', ciudad: 'Lima', direccion: 'Av. Miraflores', fecha: '22/07/2025' },
  { id: 3, nombre: 'Almacén Central', departamento: 'Cajamarca', ciudad: 'Cajamarca', direccion: 'Calle Rosario', fecha: '01/01/2025' },
  { id: 4, nombre: 'Almacén Central', departamento: 'Moquegua', ciudad: 'Mariscal Nieto', direccion: 'Av. Everest', fecha: '23/02/2025' },
];

export default function AlmacenCourierTable({ onVer, onEditar }: Props) {
  const handleVer = onVer ?? (() => {});
  const handleEditar = onEditar ?? (() => {});

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
          {almacenesMock.map((almacen, index) => (
            <tr
              key={almacen.id ?? `${almacen.nombre}-${index}`}
              className={`border-b last:border-none ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
            >
              <td className="px-5 py-4">{almacen.nombre}</td>
              <td className="px-5 py-4">{almacen.departamento}</td>
              <td className="px-5 py-4">{almacen.ciudad}</td>
              <td className="px-5 py-4">{almacen.direccion}</td>
              <td className="px-5 py-4">{almacen.fecha ?? '-'}</td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Ver"
                    onClick={() => handleVer(almacen)}
                  >
                    <Icon icon="uil:eye" width="20" height="20" />
                  </button>
                  <button
                    type="button"
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                    title="Editar"
                    onClick={() => handleEditar(almacen)}
                  >
                    <Icon icon="uil:edit" width="20" height="20" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {almacenesMock.length === 0 && (
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
