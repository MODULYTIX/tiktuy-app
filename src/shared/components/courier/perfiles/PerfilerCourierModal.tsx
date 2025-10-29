// src/shared/components/courier/perfiles/PerfilesCourierModal.tsx
import { useEffect, useRef, useState } from "react";
import { registerTrabajador } from "@/services/ecommerce/perfiles/perfilesTrabajador.api";

// 🧩 Tus componentes base
import { Inputx } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const rolModuloMap: Record<string, string[]> = {
  // courier roles (IDs según tu DB)
  "4": ["almacen", "stock", "movimiento"], // AlmaceneroCourier
  "5": ["panel", "reportes", "saldos", "perfiles", "almacen", "pedidos"], // AsistenteCourier
  "6": ["pedidos"], // RepartidorCourier
};

const moduloLabelMap: Record<string, string> = {
  panel: "Panel de Control",
  almacen: "Almacén",
  productos: "Productos",
  stock: "Stock de Productos",
  movimiento: "Movimientos",
  pedidos: "Pedidos",
  saldos: "Saldos",
  perfiles: "Perfiles",
  reportes: "Reportes",
};

export default function PerfilesCourierModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    correo: "",
    password: "",
    confirmarPassword: "",
    rol_perfil_id: "",
  });
  const [modulos, setModulos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Cuando cambia el rol, preselecciona el primer módulo recomendado
  useEffect(() => {
    const posibles = rolModuloMap[form.rol_perfil_id] || [];
    setModulos(posibles.length ? [posibles[0]] : []);
  }, [form.rol_perfil_id]);

  // Cerrar al hacer click fuera
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
  };

  const handleRemoveModulo = (modulo: string) => {
    setModulos((prev) => prev.filter((m) => m !== modulo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
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
      await registerTrabajador(
        {
          nombres: form.nombre,
          apellidos: form.apellido,
          correo: form.correo,
          contrasena: form.password,
          telefono: form.telefono,
          DNI_CI: form.dni,
          rol_perfil_id: Number(form.rol_perfil_id),
          modulos,
        },
        token
      );
      onCreated?.();
      onClose();
      setForm({
        nombre: "",
        apellido: "",
        dni: "",
        telefono: "",
        correo: "",
        password: "",
        confirmarPassword: "",
        rol_perfil_id: "",
      });
      setModulos([]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al registrar trabajador");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modulosDisponibles = rolModuloMap[form.rol_perfil_id] || [];
  const modulosFiltrados = modulosDisponibles.filter((m) => !modulos.includes(m));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      {/* Drawer */}
      <div
        ref={modalRef}
        className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl p-5 flex flex-col gap-5"
      >
        {/* Header (sin botón X) */}
        <Tittlex
          variant="modal"
          icon="mdi:account-plus-outline"
          title="REGISTRAR NUEVO PERFIL"
          description="Crea un nuevo perfil completando la información personal, datos de contacto, rol y los módulos que tendrá habilitados dentro del sistema."
        />

        {/* Error */}
        {error && (
          <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Inputx
            name="nombre"
            label="Nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            type="text"
          />
          <Inputx
            name="apellido"
            label="Apellido"
            placeholder="Apellido"
            value={form.apellido}
            onChange={handleChange}
            required
            type="text"
          />

          <Inputx
            name="dni"
            label="DNI / CI"
            placeholder="DNI / CI"
            value={form.dni}
            onChange={handleChange}
            required
            type="text"
          />
          <Inputx
            name="telefono"
            label="Teléfono ( +51 )"
            placeholder="987654321"
            value={form.telefono}
            onChange={handleChange}
            required
            type="tel"
            inputMode="numeric"
          />

          <Inputx
            name="correo"
            label="Correo"
            placeholder="correo@gmail.com"
            value={form.correo}
            onChange={handleChange}
            required
            type="email"
          />
          <Selectx
            label="Rol Perfil"
            labelVariant="left"
            value={form.rol_perfil_id}
            onChange={handleChange}
            name="rol_perfil_id"
            placeholder="Seleccionar rol"
          >
            <option value="4">AlmaceneroCourier</option>
            <option value="5">AsistenteCourier</option>
            <option value="6">RepartidorCourier</option>
          </Selectx>

          <Inputx
            name="password"
            label="Contraseña"
            placeholder="Escribir aquí"
            value={form.password}
            onChange={handleChange}
            required
            type="password"
          />
          <Inputx
            name="confirmarPassword"
            label="Repetir Contraseña"
            placeholder="Escribir aquí"
            value={form.confirmarPassword}
            onChange={handleChange}
            required
            type="password"
          />

          {/* Selector de Módulos + chips */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <Selectx
              label="Módulo"
              labelVariant="left"
              value=""
              onChange={handleAddModulo}
              placeholder="Seleccionar módulo"
            >
              {modulosFiltrados.map((mod) => (
                <option key={mod} value={mod}>
                  {moduloLabelMap[mod] || mod}
                </option>
              ))}
            </Selectx>

            {/* Chips de módulos seleccionados */}
            <div className="flex flex-wrap gap-2">
              {modulos.map((mod) => (
                <div
                  key={mod}
                  className="bg-gray-100 text-[12px] text-gray-700 px-3 py-1 rounded-full inline-flex items-center gap-2"
                >
                  {moduloLabelMap[mod] || mod}
                  <button
                    type="button"
                    onClick={() => handleRemoveModulo(mod)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Quitar ${mod}`}
                    title="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="md:col-span-2 flex justify-end gap-3">
            <Buttonx
              variant="secondary"
              label={loading ? "Creando..." : "Crear nuevo"}
              className="px-4 text-sm"
              onClick={"handleSubmit" as any}
              disabled={loading}
            />
            <Buttonx
              variant="outlined"
              label="Cancelar"
              className="px-4 text-sm"
              onClick={onClose}
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
