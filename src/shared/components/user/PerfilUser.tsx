// src/pages/perfil/PerfilUser.tsx
import { Icon } from "@iconify/react";
import { useAuth } from "@/auth/context/useAuth";

type Props = {
  onClose: () => void;
};

export default function PerfilUser({ onClose }: Props) {
  const { user, logout } = useAuth();

  const initials =
    `${user?.nombres?.[0] ?? ""}${user?.apellidos?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-semibold">
              {initials || "U"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {user?.nombres} {user?.apellidos}
              </p>
              <p className="text-xs text-gray-500">{user?.rol?.nombre}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Cerrar"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="p-5 space-y-6 text-sm overflow-y-auto max-h-[70vh]">

          {/* Perfil */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Perfil
            </h3>

            <div className="space-y-3">
              <InfoRow
                icon="mdi:account"
                label="Nombre"
                value={`${user?.nombres} ${user?.apellidos}`}
              />
              <InfoRow
                icon="mdi:email-outline"
                label="Correo"
                value={user?.correo || "-"}
              />
            </div>
          </section>

          {/* Cuenta */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Cuenta
            </h3>

            <div className="space-y-3">
              <InfoRow
                icon="mdi:shield-account-outline"
                label="Rol"
                value={user?.rol?.nombre}
              />
              <InfoRow
                icon="mdi:domain"
                label="Ecommerce"
                value={user?.ecommerce_nombre || "—"}
              />
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Seguridad
            </h3>

            <div className="space-y-2">
              <ActionButton
                icon="mdi:lock-reset"
                label="Cambiar contraseña"
                onClick={() => alert("Abrir flujo cambiar contraseña")}
              />
            </div>
          </section>

          {/* Sesión */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Sesión
            </h3>

            <ActionButton
              icon="mdi:logout"
              label="Cerrar sesión"
              danger
              onClick={() => {
                onClose();
                logout?.();
              }}
            />
          </section>
        </div>

        {/* ===== Footer ===== */}
        <div className="border-t px-5 py-3 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-white border hover:bg-gray-100 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   COMPONENTES AUXILIARES
========================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon icon={icon} className="text-lg text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-gray-700 hover:bg-gray-100"
        }`}
    >
      <Icon icon={icon} className="text-lg" />
      {label}
    </button>
  );
}
