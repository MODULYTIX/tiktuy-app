import { useState, useEffect } from 'react';
import { createAlmacenamiento, updateAlmacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import Tittlex from '@/shared/common/Tittlex';
import { Inputx } from '@/shared/common/Inputx';
import { Selectx } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';

interface Props {
  token: string;
  onClose(): void;
  onSuccess(nuevo: Almacenamiento): void;
  modo?: 'crear' | 'editar';
  almacen?: Almacenamiento | null;
}

interface Ubigeo {
  codigo: string;
  nombre: string; // "DEPARTAMENTO/PROVINCIA/DISTRITO"
}

export default function CrearAlmacenModal({
  token,
  onClose,
  onSuccess,
  modo = 'crear',
  almacen,
}: Props) {
  const [form, setForm] = useState({
    nombre_almacen: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
  });

  const [ubigeos, setUbigeos] = useState<Ubigeo[]>([]);
  const [provincias, setProvincias] = useState<Ubigeo[]>([]);
  const [distritos, setDistritos] = useState<Ubigeo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carga y transforma ubigeos
  useEffect(() => {
    fetch('https://free.e-api.net.pe/ubigeos.json')
      .then((res) => res.json())
      .then((data) => {
        const result: Ubigeo[] = [];
        Object.entries(data).forEach(([depName, provinciasObj]) => {
          Object.entries(provinciasObj as Record<string, any>).forEach(([provName, distritosObj]) => {
            Object.entries(distritosObj as Record<string, any>).forEach(([distName, info]) => {
              result.push({ codigo: info.ubigeo, nombre: `${depName}/${provName}/${distName}` });
            });
          });
        });
        setUbigeos(result);
      })
      .catch(console.error);
  }, []);

  // Precarga si es edición
  useEffect(() => {
    if (modo === 'editar' && almacen && ubigeos.length > 0) {
      const match = ubigeos.find((u) => {
        const [dep, , dist] = u.nombre.split('/');
        return dep === almacen.departamento && dist === almacen.ciudad;
      });
      const [, provincia] = match?.nombre.split('/') ?? [];
      setForm({
        nombre_almacen: almacen.nombre_almacen || '',
        departamento: almacen.departamento || '',
        provincia: provincia || '',
        distrito: match?.codigo || '',
        direccion: almacen.direccion || '',
      });
    }
  }, [modo, almacen, ubigeos]);

  // Provincias según departamento
  useEffect(() => {
    setProvincias([]);
    setDistritos([]);
    if (!form.departamento) return;

    const provs = ubigeos
      .filter((u) => u.nombre.startsWith(form.departamento + '/'))
      .reduce((acc: Record<string, Ubigeo>, item) => {
        const [, prov] = item.nombre.split('/');
        if (!acc[prov]) acc[prov] = item;
        return acc;
      }, {});
    setProvincias(Object.values(provs));
  }, [form.departamento, ubigeos]);

  // Distritos según provincia
  useEffect(() => {
    setDistritos([]);
    if (!form.departamento || !form.provincia) return;
    const dists = ubigeos.filter((u) => u.nombre.startsWith(`${form.departamento}/${form.provincia}/`));
    setDistritos(dists);
  }, [form.provincia, form.departamento, ubigeos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'departamento' && { provincia: '', distrito: '' }),
      ...(name === 'provincia' && { distrito: '' }),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const selected = ubigeos.find((u) => u.codigo === form.distrito);
      const [departamento, , distrito] = selected?.nombre.split('/') ?? [];

      if (modo === 'crear') {
        const nuevo = await createAlmacenamiento(
          { nombre_almacen: form.nombre_almacen, departamento, ciudad: distrito, direccion: form.direccion },
          token
        );
        onSuccess(nuevo);
      } else if (modo === 'editar' && almacen) {
        const actualizado = await updateAlmacenamiento(
          almacen.uuid,
          { nombre_almacen: form.nombre_almacen, departamento, ciudad: distrito, direccion: form.direccion },
          token
        );
        onSuccess(actualizado);
      }
      onClose();
    } catch {
      setError('Error al guardar almacén');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Estilos normalizados para inputs/select
  const labelClass = "block text-gray-700 font-medium mb-1";

  return (
    <div className="fixed inset-0 bg-backgroundModal z-50 flex justify-end">
      {/* Drawer angosto + layout columna (footer fijo), padding 20px y 20px vertical entre bloques */}
      <div className="w-[440px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col gap-5 px-5 py-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="hugeicons:warehouse" // pon aquí el nombre del ícono de Iconify que prefieras
          title={modo === "editar" ? "Editar Almacén" : "Registrar Nuevo Almacén"}
          description={
            modo === "editar"
              ? "Edite el almacén y cambie el punto de origen o destino en sus operaciones logísticas."
              : "Complete la información para registrar un nuevo almacén y habilitarlo como punto de origen o destino en sus operaciones logísticas."
          }
        />

        {/* Contenido */}
        <div className="flex flex-col gap-5 flex-1 overflow-auto">
          {/* Nombre de Almacén */}
          <Inputx
            label="Nombre de Almacén"
            placeholder="Ejem. Almacén secundario"
            type="text"
            name="nombre_almacen"
            value={form.nombre_almacen}
            onChange={handleChange}
          />

          <Selectx
            label="Departamento"
            labelVariant="left"
            name="departamento"
            value={form.departamento}
            onChange={handleChange}
            placeholder="Seleccionar departamento"
          >
            {[...new Set(ubigeos.map((u) => u.nombre.split("/")[0]))]
              .sort()
              .map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
          </Selectx>

          <Selectx
            label="Provincia"
            labelVariant="left"
            name="provincia"
            value={form.provincia}
            onChange={handleChange}
            placeholder="Seleccionar provincia"
            disabled={!provincias.length}
            className={`disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {provincias.map((p) => {
              const nombre = p.nombre.split("/")[1];
              return (
                <option key={p.nombre} value={nombre}>
                  {nombre}
                </option>
              );
            })}
          </Selectx>

          <Selectx
            label="Ciudad"
            labelVariant="left"
            name="distrito"
            value={form.distrito}
            onChange={handleChange}
            placeholder="Seleccionar ciudad"
            disabled={!distritos.length}
            className={`disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {distritos.map((d) => (
              <option key={d.codigo} value={d.codigo}>
                {d.nombre.split("/")[2]}
              </option>
            ))}
          </Selectx>

          <Inputx
            label="Dirección"
            type="text"
            name="direccion"
            placeholder="Ejem. Av. Los Próceres 1234, Urb. Santa Catalina, La Victoria, Lima"
            value={form.direccion}
            onChange={handleChange}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* Footer: botones abajo a la izquierda */}
        <div className="border-t border-gray20 flex items-center gap-5">

          <Buttonx
            variant="quartery"
            onClick={handleSubmit}
            disabled={loading}
            label={
              modo === "editar"
                ? loading ? "Guardando..." : "Guardar cambios"
                : loading ? "Creando..." : "Crear nuevo"
            }
            icon={loading ? "line-md:loading-twotone-loop" : undefined}
            className={`px-4 ${loading ? "[&_svg]:animate-spin" : ""}`}
          />

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm border"
          />
        </div>
      </div>
    </div>
  );
}
