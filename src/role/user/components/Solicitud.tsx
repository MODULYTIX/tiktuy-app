import { useEffect, useState } from 'react';
import { BiMap, BiPhone } from 'react-icons/bi';
import TittleX from '../common/TittleX';
import { AiOutlineMail } from 'react-icons/ai';
import { GiCube } from 'react-icons/gi';
import { BsSendArrowUp } from 'react-icons/bs';
import { Icon } from '@iconify/react/dist/iconify.js';

import type { SolicitudCourierInput } from '../service/solicitud-courier.types';
import type {
  SolicitudEcommerceInput,
} from '../service/solicitud-ecommerce.types';

import {
  fetchDepartamentosPublic,
  fetchCiudadesPublic,
} from '../service/ubigeo-public.api';

import { registrarSolicitudCourier } from '../service/solitud-courier.api';

import {
  registrarSolicitudEcommerce,
} from '../service/solitud-courier.api';

type Msg = { type: 'ok' | 'err'; text: string } | null;

type TipoSolicitud = 'courier' | 'ecommerce';

export default function Solicitud() {
  const [tipo, setTipo] = useState<TipoSolicitud>('courier'); // selector
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  // --------------------------
  // Formulario COURIER (igual al tuyo)
  // --------------------------
  const [form, setForm] = useState<SolicitudCourierInput>({
    // Personales
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    dni_ci: '',
    telefono: '',
    // Empresa
    nombre_comercial: '',
    ruc: '',
    representante: '',
    departamento: '',
    ciudad: '',
    direccion: '',
  });

  // --------------------------
  // Formulario ECOMMERCE (nuevo)
  // (mantengo diseño similar y estructura de grids; campos se adaptan)
  // --------------------------
  const [formE, setFormE] = useState<SolicitudEcommerceInput>({
    // Personales
    nombres: '',
    apellido: '',
    dni_ci: '',
    correo: '',
    telefono: '',
    // Empresa
    nombre_comercial: '',
    ruc: '',
    ciudad: '',
    direccion: '',
    rubro: '',
  });

  // --- estado para selects dinámicos (sin cambiar diseño) ---
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  // Cargar departamentos al montar (para el selector de Courier)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingDeps(true);
        const deps = await fetchDepartamentosPublic();
        if (!mounted) return;
        setDepartamentos(deps);
      } catch {
        if (!mounted) return;
        setDepartamentos([]);
      } finally {
        if (mounted) setLoadingDeps(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar ciudades cuando cambia el departamento (Courier)
  useEffect(() => {
    let active = true;

    (async () => {
      if (!form.departamento) {
        setCiudades([]);
        return;
      }
      try {
        setLoadingCiudades(true);
        const list = await fetchCiudadesPublic(form.departamento);
        if (!active) return;
        setCiudades(list);
      } catch {
        if (!active) return;
        setCiudades([]);
      } finally {
        if (active) setLoadingCiudades(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [form.departamento]);

  // Handlers de cambio (Courier)
  const onChange =
    (key: keyof SolicitudCourierInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((s) => ({
        ...s,
        [key]: value,
        ...(key === 'departamento' ? { ciudad: '' } : null),
      }));
    };

  // Handlers de cambio (Ecommerce)
  const onChangeE =
    (key: keyof SolicitudEcommerceInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFormE((s) => ({
        ...s,
        [key]: value,
      }));
    };

  // Validación (Courier)
  function validateCourier(data: SolicitudCourierInput): string | null {
    if (!data.nombres.trim()) return 'Ingrese sus nombres';
    if (!data.correo.trim()) return 'Ingrese su E-mail';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) return 'E-mail inválido';
    if (!data.dni_ci.trim()) return 'Ingrese su DNI';
    if (!data.nombre_comercial.trim()) return 'Ingrese el nombre comercial';
    if (!data.ruc.trim()) return 'Ingrese el RUC';
    if (!data.representante.trim()) return 'Ingrese el representante';
    if (!data.departamento.trim()) return 'Seleccione el departamento';
    if (!data.ciudad.trim()) return 'Seleccione la ciudad';
    if (!data.direccion.trim()) return 'Ingrese la dirección';
    return null;
  }

  // Validación (Ecommerce) — personales obligatorios; empresa OPCIONAL
  function validateEcommerce(data: SolicitudEcommerceInput): string | null {
    if (!data.nombres.trim()) return 'Ingrese sus nombres';
    if (!data.correo.trim()) return 'Ingrese su E-mail';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) return 'E-mail inválido';
    if (!data.dni_ci.trim()) return 'Ingrese su DNI';

    // Empresa opcional: si el usuario empieza a llenar algo de empresa,
    // pedimos al menos nombre_comercial y ruc juntos; validamos formato básico si existen.
    const anyEmpresa =
      (data.nombre_comercial && data.nombre_comercial.trim().length > 0) ||
      (data.ruc && data.ruc.trim().length > 0) ||
      (data.ciudad && data.ciudad.trim().length > 0) ||
      (data.direccion && data.direccion.trim().length > 0) ||
      (data.rubro && data.rubro.trim().length > 0);

    if (anyEmpresa) {
      const hasNombre = !!data.nombre_comercial?.trim();
      const hasRuc = !!data.ruc?.trim();

      if (hasNombre && !hasRuc) return 'Ingrese el RUC o deje los datos de empresa vacíos';
      if (!hasNombre && hasRuc) return 'Ingrese el nombre comercial o deje los datos de empresa vacíos';

      if (hasRuc && !/^\d{8,}$/.test(data.ruc!)) return 'RUC inválido';
      // ciudad/dirección/rubro siguen siendo opcionales: solo validamos si vienen
      if (data.ciudad && !data.ciudad.trim()) return 'Ingrese una ciudad válida o deje el campo vacío';
      if (data.direccion && !data.direccion.trim()) return 'Ingrese una dirección válida o deje el campo vacío';
      if (data.rubro && !data.rubro.trim()) return 'Ingrese un rubro válido o deje el campo vacío';
    }

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      setLoading(true);

      if (tipo === 'courier') {
        const err = validateCourier(form);
        if (err) {
          setMsg({ type: 'err', text: err });
          return;
        }
        const res = await registrarSolicitudCourier(form);
        setMsg({ type: 'ok', text: res.message || 'Solicitud registrada correctamente.' });

        // limpiar formulario courier
        setForm({
          nombres: '',
          apellido_paterno: '',
          apellido_materno: '',
          correo: '',
          dni_ci: '',
          telefono: '',
          nombre_comercial: '',
          ruc: '',
          representante: '',
          departamento: '',
          ciudad: '',
          direccion: '',
        });
        setCiudades([]);
      } else {
        const err = validateEcommerce(formE);
        if (err) {
          setMsg({ type: 'err', text: err });
          return;
        }
        const res = await registrarSolicitudEcommerce(formE);
        setMsg({ type: 'ok', text: res.message || 'Solicitud registrada correctamente.' });

        // limpiar formulario ecommerce
        setFormE({
          nombres: '',
          apellido: '',
          correo: '',
          dni_ci: '',
          telefono: '',
          nombre_comercial: '',
          ruc: '',
          ciudad: '',
          direccion: '',
          rubro: '',
        });
      }
    } catch (e: any) {
      setMsg({
        type: 'err',
        text: e?.message || 'No se pudo registrar la solicitud. Intente nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-15 my-15">
      {/* Título principal con subrayado corto (usa tu TittleX) */}
      <TittleX className="text-5xl">Únete a nosotros</TittleX>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Columna izquierda */}
        <div className="flex-1 max-w-[600px] space-y-6">
          <div className="space-y-3">
            <h1 className="leading-tight">
              <span className="block text-5xl font-semibold">
                <span className="text-[#FF8A00]">Conéctese</span>{' '}
                <span className="text-[#0057A3]">con Nosotros</span> Hoy
              </span>
            </h1>
            <p className="text-gray-600">
              ¿Listo para llevar su logística al siguiente nivel? Contáctenos
              hoy mismo para descubrir cómo nuestras soluciones pueden
              transformar su cadena de suministro.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-[#0057A3]">
            <div className="px-6 py-4 border rounded-xl border-[#99BCDA] min-w-[260px] flex-1">
              <div className="flex gap-2 items-center mb-2">
                <span className="p-2 rounded-full bg-[#E6EEF6]">
                  <BiPhone className="text-xl" />
                </span>
                <p className="font-semibold">Telefono</p>
              </div>
              <p className="text-gray-700">(+51) 987 654 321</p>
            </div>

            <div className="px-6 py-4 border rounded-xl border-[#99BCDA] min-w-[260px] flex-1">
              <div className="flex gap-2 items-center mb-2">
                <span className="p-2 rounded-full bg-[#E6EEF6]">
                  <AiOutlineMail className="text-xl" />
                </span>
                <p className="font-semibold">E-mail</p>
              </div>
              <p className="text-gray-700">contacto@tiktuy.lat</p>
            </div>

            <div className="px-6 py-4 border rounded-xl border-[#99BCDA] min-w-[260px] flex-[1_1_100%]">
              <div className="flex gap-2 items-center mb-2">
                <span className="p-2 rounded-full bg-[#E6EEF6]">
                  <BiMap className="text-xl" />
                </span>
                <p className="font-semibold">Dirección</p>
              </div>
              <p className="text-gray-700 uppercase">
                AV. VENEZUELA 132, CERCADO DE AREQUIPA
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha - Formulario (mismo diseño) */}
        <form
          onSubmit={onSubmit}
          className="w-full lg:max-w-[640px] rounded-2xl border border-[#99BCDA] p-6 lg:p-8 shadow-sm">

          {/* Selector de tipo (tabs muy simples, sin cambiar el look & feel) */}
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => setTipo('courier')}
              className={`px-3 py-1.5 rounded-md border ${
                tipo === 'courier'
                  ? 'bg-[#0057A3] text-white border-[#0057A3]'
                  : 'bg-white text-[#0057A3] border-[#99BCDA]'
              }`}
            >
              Courier
            </button>
            <button
              type="button"
              onClick={() => setTipo('ecommerce')}
              className={`px-3 py-1.5 rounded-md border ${
                tipo === 'ecommerce'
                  ? 'bg-[#0057A3] text-white border-[#0057A3]'
                  : 'bg-white text-[#0057A3] border-[#99BCDA]'
              }`}
            >
              Ecommerce
            </button>
          </div>

          {/* mensaje */}
          {msg && (
            <div
              className={`mb-4 rounded-md px-3 py-2 text-sm ${
                msg.type === 'ok'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              {msg.text}
            </div>
          )}

          {/* Datos personales */}
          <section className="space-y-4">
            <div className="border-b border-[#99BCDA] pb-3">
              <p className="flex items-center gap-2 text-gray-800 font-semibold">
                <GiCube className="text-[#0057A3]" />
                Datos Personales
              </p>
            </div>

            {tipo === 'courier' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Nombres</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese sus nombres"
                    value={form.nombres}
                    onChange={onChange('nombres')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Apellido Paterno</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su apellido paterno"
                    value={form.apellido_paterno}
                    onChange={onChange('apellido_paterno')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Apellido Materno</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su apellido materno"
                    value={form.apellido_materno}
                    onChange={onChange('apellido_materno')}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">E-mail</label>
                  <input
                    type="email"
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su E-mail"
                    value={form.correo}
                    onChange={onChange('correo')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">DNI</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su DNI"
                    value={form.dni_ci}
                    onChange={onChange('dni_ci')}
                  />
                </div>

                {/* Teléfono con prefijo */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Teléfono</label>
                  <div className="h-10 rounded-md border border-[#99BCDA] flex overflow-hidden">
                    <span className="px-1 flex items-center border-r border-[#99BCDA] text-[12px] text-[#525252] gap-0.5">
                      <Icon icon="openmoji:flag-peru" width="14" height="14" />
                      (+51)
                    </span>
                    <input
                      className="flex-1 px-1 text-sm outline-none"
                      placeholder="Ingrese su teléfono"
                      value={form.telefono ?? ''}
                      onChange={onChange('telefono')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Ecommerce
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Nombres</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese sus nombres"
                    value={formE.nombres}
                    onChange={onChangeE('nombres')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Apellido</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su apellido"
                    value={formE.apellido ?? ''}
                    onChange={onChangeE('apellido')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">E-mail</label>
                  <input
                    type="email"
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su E-mail"
                    value={formE.correo}
                    onChange={onChangeE('correo')}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">DNI</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su DNI"
                    value={formE.dni_ci}
                    onChange={onChangeE('dni_ci')}
                  />
                </div>

                {/* Teléfono con prefijo */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Teléfono</label>
                  <div className="h-10 rounded-md border border-[#99BCDA] flex overflow-hidden">
                    <span className="px-1 flex items-center border-r border-[#99BCDA] text-[12px] text-[#525252] gap-0.5">
                      <Icon icon="openmoji:flag-peru" width="14" height="14" />
                      (+51)
                    </span>
                    <input
                      className="flex-1 px-1 text-sm outline-none"
                      placeholder="Ingrese su teléfono"
                      value={formE.telefono ?? ''}
                      onChange={onChangeE('telefono')}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Datos de la empresa */}
          <section className="space-y-4 mt-6">
            <div className="border-b border-[#99BCDA] pb-3">
              <p className="flex items-center gap-2 text-gray-800 font-semibold">
                <GiCube className="text-[#0057A3]" />
                {/*  Aqui podrias poner  que solo ecomer tenga el (Opcional), pero el courier no tenga esa opcion,sequeda haci*/}
                {/* Hecho: solo Ecommerce muestra "(Opcional)" */}
                Datos de la empresa{tipo === 'ecommerce' ? ' (Opcional)' : ''}
              </p>
            </div>

            {tipo === 'courier' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Nombre Comercial</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su nombre comercial"
                    value={form.nombre_comercial}
                    onChange={onChange('nombre_comercial')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">RUC</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su RUC"
                    value={form.ruc}
                    onChange={onChange('ruc')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Representante</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su nombre de representante"
                    value={form.representante}
                    onChange={onChange('representante')}
                  />
                </div>

                {/* Departamento */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Departamento</label>
                  <select
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none bg-white focus:ring-2 focus:ring-[#99BCDA]"
                    value={form.departamento}
                    onChange={onChange('departamento')}
                    disabled={loadingDeps}>
                    <option value="">
                      {loadingDeps ? 'Cargando…' : 'Seleccione su departamento'}
                    </option>
                    {departamentos.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Ciudad</label>
                  <select
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none bg-white focus:ring-2 focus:ring-[#99BCDA]"
                    value={form.ciudad}
                    onChange={onChange('ciudad')}
                    disabled={!form.departamento || loadingCiudades}>
                    <option value="">
                      {!form.departamento
                        ? 'Seleccione un departamento primero'
                        : loadingCiudades
                        ? 'Cargando…'
                        : 'Seleccione su ciudad'}
                    </option>
                    {ciudades.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Dirección</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su dirección"
                    value={form.direccion}
                    onChange={onChange('direccion')}
                  />
                </div>
              </div>
            ) : (
              // Ecommerce
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Nombre Comercial</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su nombre comercial"
                    value={formE.nombre_comercial}
                    onChange={onChangeE('nombre_comercial')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">RUC</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su RUC"
                    value={formE.ruc}
                    onChange={onChangeE('ruc')}
                  />
                </div>

                {/* Rubro (campo propio de Ecommerce) */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Rubro</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ej. Moda, Tecnología, Alimentos"
                    value={formE.rubro}
                    onChange={onChangeE('rubro')}
                  />
                </div>

                {/* Ciudad (Ecommerce no requiere departamento en tu schema) */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Ciudad</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su ciudad"
                    value={formE.ciudad}
                    onChange={onChangeE('ciudad')}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">Dirección</label>
                  <input
                    className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                    placeholder="Ingrese su dirección"
                    value={formE.direccion}
                    onChange={onChangeE('direccion')}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Botón enviar */}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={loading}
              className="
                flex items-center gap-2 bg-[#0057A3] text-white px-6 py-2 rounded-md
                font-semibold shadow-sm hover:brightness-95 active:scale-[0.99]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#99BCDA]
                disabled:opacity-60
              ">
              {loading ? 'Enviando...' : 'Enviar solicitud'}
              <BsSendArrowUp className={`text-lg ${loading ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
