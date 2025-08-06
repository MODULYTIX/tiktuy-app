import { useState, useEffect } from 'react';
import { createAlmacenamiento, updateAlmacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { PiGarageLight } from 'react-icons/pi';
import { FaSpinner } from 'react-icons/fa';

interface Props {
  token: string;
  onClose(): void;
  onSuccess(nuevo: Almacenamiento): void;
  modo?: 'crear' | 'editar';
  almacen?: Almacenamiento | null;
}

interface Ubigeo {
  codigo: string;
  nombre: string; // Formato: "DEPARTAMENTO/PROVINCIA/DISTRITO"
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

  // Carga y transforma todos los ubigeos
  useEffect(() => {
    fetch('https://free.e-api.net.pe/ubigeos.json')
      .then((res) => res.json())
      .then((data) => {
        const result: Ubigeo[] = [];
        Object.entries(data).forEach(([depName, provinciasObj]) => {
          Object.entries(provinciasObj as Record<string, any>).forEach(
            ([provName, distritosObj]) => {
              Object.entries(distritosObj as Record<string, any>).forEach(
                ([distName, info]) => {
                  result.push({
                    codigo: info.ubigeo,
                    nombre: `${depName}/${provName}/${distName}`,
                  });
                }
              );
            }
          );
        });
        setUbigeos(result);
      })
      .catch(console.error);
  }, []);

  // Precarga si es modo edición
  useEffect(() => {
    if (modo === 'editar' && almacen && ubigeos.length > 0) {
      const match = ubigeos.find((u) => {
        const [dep, , dist] = u.nombre.split('/');
        return dep === almacen.departamento && dist === almacen.ciudad;
      });

      const [, provincia, distrito] = match?.nombre.split('/') ?? [];

      setForm({
        nombre_almacen: almacen.nombre_almacen || '',
        departamento: almacen.departamento || '',
        provincia: provincia || '',
        distrito: match?.codigo || '',
        direccion: almacen.direccion || '',
      });
    }
  }, [modo, almacen, ubigeos]);

  // Carga provincias según departamento
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

  // Carga distritos según provincia
  useEffect(() => {
    setDistritos([]);
    if (!form.departamento || !form.provincia) return;

    const dists = ubigeos.filter(
      (u) => u.nombre.startsWith(`${form.departamento}/${form.provincia}/`)
    );
    setDistritos(dists);
  }, [form.provincia, form.departamento, ubigeos]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
          {
            nombre_almacen: form.nombre_almacen,
            departamento,
            ciudad: distrito,
            direccion: form.direccion,
          },
          token
        );
        onSuccess(nuevo);
      } else if (modo === 'editar' && almacen) {
        const actualizado = await updateAlmacenamiento(
          almacen.uuid,
          {
            nombre_almacen: form.nombre_almacen,
            departamento,
            ciudad: distrito,
            direccion: form.direccion,
          },
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

  return (
    <div className="fixed inset-0 bg-backgroundModal z-50 flex justify-end">
      <div className="bg-white p-6 rounded-l-md w-full max-w-md h-full overflow-auto shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <PiGarageLight size={20} className="text-primaryDark" />
          <h2 className="text-lg font-bold uppercase">
            {modo === 'editar' ? 'Editar Almacén' : 'Registrar Nuevo Almacén'}
          </h2>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          {modo === 'editar'
            ? 'Modifique la información del almacén seleccionado.'
            : 'Complete la información para registrar un nuevo almacén...'}
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Nombre de Almacén</label>
            <input
              type="text"
              name="nombre_almacen"
              placeholder="Ej. Almacén Central"
              value={form.nombre_almacen}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#1A253D]"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Departamento</label>
            <select
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2">
              <option value="">Seleccionar departamento</option>
              {[...new Set(ubigeos.map((u) => u.nombre.split('/')[0]))]
                .sort()
                .map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Provincia</label>
            <select
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={!provincias.length}>
              <option value="">Seleccionar provincia</option>
              {provincias.map((p) => (
                <option key={p.nombre} value={p.nombre.split('/')[1]}>
                  {p.nombre.split('/')[1]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Ciudad</label>
            <select
              name="distrito"
              value={form.distrito}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={!distritos.length}>
              <option value="">Seleccionar Ciudad</option>
              {distritos.map((d) => (
                <option key={d.codigo} value={d.codigo}>
                  {d.nombre.split('/')[2]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Dirección</label>
            <input
              type="text"
              name="direccion"
              placeholder="Ej. Av. Las Flores 123, Urb. Santa Ana"
              value={form.direccion}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#1A253D] text-white px-4 py-2 rounded flex items-center gap-2">
            {loading && <FaSpinner className="animate-spin" />}
            {modo === 'editar' ? 'Guardar Cambios' : 'Crear nuevo'}
          </button>
        </div>
      </div>
    </div>
  );
}
