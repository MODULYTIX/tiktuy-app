import { useState, useEffect } from 'react';
import { createAlmacenamiento, updateAlmacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { PiGarageLight } from 'react-icons/pi';
import { FaSpinner } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';

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
  const fieldClass =
    "w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors";
  const labelClass = "block text-gray-700 font-medium mb-1";

  return (
    <div className="fixed inset-0 bg-backgroundModal z-50 flex justify-end">
      {/* Drawer angosto + layout columna (footer fijo), padding 20px y 20px vertical entre bloques */}
      <div className="w-[420px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray20">
          <div className="flex items-center gap-2 mb-5">
            <PiGarageLight size={20} className="text-primaryDark" />
            <h2 className="text-lg font-bold uppercase">{
              modo === 'editar' ? 'Editar Almacén' : 'Registrar Nuevo Almacén'
            }</h2>
          </div>

          <p className="text-sm text-gray-600">
            {modo === 'editar'
              ? 'Edite el almacén y cambie el punto de origen o destino en sus operaciones logísticas.'
              : 'Complete la información para registrar un nuevo almacén y habilitarlo como punto de origen o destino en sus operaciones logísticas.'}
          </p>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-5 space-y-5 text-sm">
          <div>
            <label className={labelClass}>Nombre de Almacén</label>
            <input
              type="text"
              name="nombre_almacen"
              placeholder="Ejem. Almacén secundario"
              value={form.nombre_almacen}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Departamento</label>
            <div className="relative">
              <select
                name="departamento"
                value={form.departamento}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9`}
              >
                <option value="">Seleccionar departamento</option>
                {[...new Set(ubigeos.map((u) => u.nombre.split('/')[0]))]
                  .sort()
                  .map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Provincia</label>
            <div className="relative">
              <select
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!provincias.length}
              >
                <option value="">Seleccionar provincia</option>
                {provincias.map((p) => (
                  <option key={p.nombre} value={p.nombre.split('/')[1]}>
                    {p.nombre.split('/')[1]}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Ciudad</label>
            <div className="relative">
              <select
                name="distrito"
                value={form.distrito}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!distritos.length}
              >
                <option value="">Seleccionar ciudad</option>
                {distritos.map((d) => (
                  <option key={d.codigo} value={d.codigo}>
                    {d.nombre.split('/')[2]}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              name="direccion"
              placeholder="Ejem. Av. Los Próceres 1234, Urb. Santa Catalina, La Victoria, Lima"
              value={form.direccion}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* Footer: botones abajo a la izquierda */}
        <div className="p-5 border-t border-gray20 flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#1A253D] text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-70"
          >
            {loading && <FaSpinner className="animate-spin" />}
            {modo === 'editar' ? 'Guardar cambios' : 'Crear nuevo'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
