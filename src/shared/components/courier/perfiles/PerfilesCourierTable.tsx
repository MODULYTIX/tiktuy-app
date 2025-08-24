type PerfilCourier = {
    id: string;
    fechaCreacion: string;
    nombre: string;
    apellido: string;
    dni: string;
    correo: string;
    telefono: string;
    rolPerfil: string;
    modulo: string;
  };
  
  interface Props {
    perfiles: PerfilCourier[];
  }
  
  export default function PerfilesCourierTable({ perfiles }: Props) {
    return (
      <section className="my-8">
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">F. Creación</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Apellido</th>
                <th className="px-4 py-2">DNI</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Teléfono</th>
                <th className="px-4 py-2">Rol - Perfil</th>
                <th className="px-4 py-2">Módulo</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {perfiles.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No hay perfiles disponibles
                  </td>
                </tr>
              ) : (
                perfiles.map((perfil) => (
                  <tr key={perfil.id}>
                    <td className="px-4 py-2">{perfil.fechaCreacion}</td>
                    <td className="px-4 py-2">{perfil.nombre}</td>
                    <td className="px-4 py-2">{perfil.apellido}</td>
                    <td className="px-4 py-2">{perfil.dni}</td>
                    <td className="px-4 py-2">{perfil.correo}</td>
                    <td className="px-4 py-2">{perfil.telefono}</td>
                    <td className="px-4 py-2">{perfil.rolPerfil}</td>
                    <td className="px-4 py-2">{perfil.modulo}</td>
                    <td className="px-4 py-2">
                      {/* Aquí van botones o acciones */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  