import { IoClose } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { editarTrabajador } from "@/services/ecommerce/perfiles/perfilesTrabajador.api";
import type { PerfilTrabajador } from "@/services/ecommerce/perfiles/perfilesTrabajador.types";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trabajador: (PerfilTrabajador & { rol_perfil_id?: number }) | null; // si no viene el id, lo derivamos
  onUpdated?: () => void;
}

// Mapa de rol -> módulos permitidos (claves canónicas)
const rolModuloMap: Record<string, string[]> = {
  "1": ["stock", "movimiento"],
  "2": ["pedidos"],
  "3": [
    "panel",
    "almacen",
    "stock",
    "movimiento",
    "pedidos",
    "saldos",
    "perfiles",
    "reportes",
  ],
};

// Labels bonitos para cada módulo
const moduloLabelMap: Record<string, string> = {
  panel: "Panel de Control",
  almacen: "Almacén",
  stock: "Stock de Productos",
  movimiento: "Movimientos",
  pedidos: "Pedidos",
  saldos: "Saldos",
  perfiles: "Perfiles",
  reportes: "Reportes",
};

// Derivar id de rol desde el **nombre** mostrado en la tabla (campo `perfil`)
const perfilNameToId: Record<string, number> = {
  Almacenero: 1,
  Vendedor: 2,
  "Ecommerce asistente": 3,
};

// (Opcional) Derivar id también desde `rol_perfil` si existiera
const rolPerfilNameToId: Record<string, number> = {
  Almacenero: 1,
  Vendedor: 2,
  "Ecommerce asistente": 3,
};

export default function PerfilEditModal({
  isOpen,
  onClose,
  trabajador,
  onUpdated,
}: Props) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    correo: "",
    rol_perfil_id: "",
  });

  const [modulos, setModulos] = useState<string[]>([]);
  const [selectModulo, setSelectModulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  // ---------- Precarga de datos ----------
  useEffect(() => {
    if (!isOpen || !trabajador) return;

    const derivedRolId =
      trabajador.rol_perfil_id ??
      perfilNameToId[trabajador.perfil] ??
      rolPerfilNameToId[(trabajador as any).rol_perfil] ??
      "";

    const rolKey = derivedRolId ? String(derivedRolId) : "";
    const permitidos = new Set(rolModuloMap[rolKey] || []);

    const actuales = Array.isArray(trabajador.modulo_asignado)
      ? trabajador.modulo_asignado
      : [];
    let modulosIniciales = actuales.filter(
      (m) => permitidos.size === 0 || permitidos.has(m)
    );

    if (modulosIniciales.length === 0 && permitidos.size > 0) {
      modulosIniciales = [Array.from(permitidos)[0]];
    }

    setForm({
      nombre: trabajador.nombres || "",
      apellido: trabajador.apellidos || "",
      dni: trabajador.DNI_CI || "",
      telefono: trabajador.telefono || "",
      correo: trabajador.correo || "",
      rol_perfil_id: rolKey,
    });

    setModulos(modulosIniciales);
    setSelectModulo("");
    setError("");
  }, [isOpen, trabajador]);

  // ---------- Al cambiar el rol, ajusta módulos ----------
  useEffect(() => {
    if (!form.rol_perfil_id) return;
    const permitidos = new Set(rolModuloMap[form.rol_perfil_id] || []);

    setModulos((prev) => {
      const filtrados = prev.filter((m) => permitidos.size === 0 || permitidos.has(m));
      if (filtrados.length > 0) return filtrados;

      const arr = Array.from(permitidos);
      return arr.length ? [arr[0]] : [];
    });

    setSelectModulo("");
  }, [form.rol_perfil_id]);

  // ---------- Clic fuera para cerrar ----------
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddModulo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !modulos.includes(value)) setModulos((prev) => [...prev, value]);
    setSelectModulo("");
  };

  const handleRemoveModulo = (modulo: string) => {
    setModulos((prev) => prev.filter((m) => m !== modulo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajador) return;

    if (!form.rol_perfil_id) {
      setError("Debe seleccionar un rol.");
      return;
    }
    if (modulos.length === 0) {
      setError("Debe seleccionar al menos un módulo.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      await editarTrabajador(
        trabajador.id,
        {
          nombres: form.nombre,
          apellidos: form.apellido,
          telefono: form.telefono,
          correo: form.correo,
          rol_perfil_id: Number(form.rol_perfil_id),
          modulos,
        },
        token
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al editar trabajador");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trabajador) return null;

  const modulosDisponibles = rolModuloMap[form.rol_perfil_id] || [];
  const modulosFiltrados = modulosDisponibles.filter((m) => !modulos.includes(m));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div
        ref={modalRef}
        className="w-[460px] max-w-[92vw] bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Tittlex
            variant="modal"
            icon="mdi:account-edit-outline"
            title="EDITAR PERFIL"
            description="Actualiza la información personal, datos de contacto, rol y módulos asignados."
          />
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
            {/* Nombre / Apellido */}
            <div className="flex items-center gap-5">
              <Inputx
                label="Nombre"
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
              <Inputx
                label="Apellido"
                name="apellido"
                placeholder="Apellido"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>

            {/* DNI / Teléfono */}
            <div className="flex items-center gap-5">
              <Inputx
                label="DNI / CI"
                name="dni"
                placeholder="DNI / CI"
                value={form.dni}
                onChange={handleChange}
                disabled
                readOnly
              />
              <InputxPhone
                label="Teléfono"
                countryCode="+51"
                name="telefono"
                placeholder="987654321"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>

            {/* Correo / Rol */}
            <div className="flex items-center gap-5">
              <Inputx
                label="Correo"
                name="correo"
                placeholder="correo@gmail.com"
                value={form.correo}
                onChange={handleChange}
                required
              />
              <Selectx
                label="Rol Perfil"
                labelVariant="left"
                name="rol_perfil_id"
                value={form.rol_perfil_id}
                onChange={handleChange}
                placeholder="Seleccionar rol"
                required
              >
                <option value="">Seleccionar rol</option>
                <option value="1">Almacenero</option>
                <option value="2">Vendedor</option>
                <option value="3">Ecommerce asistente</option>
              </Selectx>
            </div>

            {/* Módulos */}
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium text-black">
                Acceso a Módulos
              </label>

              <Selectx
                label="Módulo"
                labelVariant="left"
                value={selectModulo}
                onChange={handleAddModulo}
                placeholder="Seleccionar módulo"
                disabled={!form.rol_perfil_id || modulosFiltrados.length === 0}
              >
                <option value="">Seleccionar módulo</option>
                {modulosFiltrados.map((mod) => (
                  <option key={mod} value={mod}>
                    {moduloLabelMap[mod] || mod}
                  </option>
                ))}
              </Selectx>

              <div className="flex flex-wrap gap-2">
                {modulos.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay módulos seleccionados.
                  </p>
                ) : (
                  modulos.map((mod) => (
                    <div
                      key={mod}
                      className="bg-gray-100 text-sm text-gray-700 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {moduloLabelMap[mod] || mod}
                      <button
                        type="button"
                        onClick={() => handleRemoveModulo(mod)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={`Quitar ${moduloLabelMap[mod] || mod}`}
                        title="Quitar"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center gap-5">
            <Buttonx
              variant="tertiary"
              type="submit"
              disabled={loading}
              label={loading ? "Guardando..." : "Guardar cambios"}
              icon={loading ? "line-md:loading-twotone-loop" : "mdi:content-save-outline"}
              className={`px-4 text-sm ${loading ? "[&_svg]:animate-spin" : ""}`}
            />
            <Buttonx
              variant="outlinedw"
              type="button"
              onClick={onClose}
              label="Cancelar"
              icon="mdi:close"
              className="px-4 text-sm border"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
