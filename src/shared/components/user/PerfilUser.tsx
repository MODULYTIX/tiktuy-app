import { Icon } from "@iconify/react";
import { useAuth } from "@/auth/context/useAuth";

type Props = {
  onClose: () => void;
};

export default function PerfilUser({ onClose }: Props) {
  const { user, logout } = useAuth();
  const initials = `${user?.nombres?.[0] ?? ""}${user?.apellidos?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">

        {/* Header: Minimalist */}
        <div className="px-6 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 truncate">
              {user?.nombres} {user?.apellidos}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-slate-500 truncate block">
                {user?.rol?.nombre}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              <span className="text-xs text-slate-400 truncate block">
                {user?.ecommerce_nombre || "Tiktuy"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        {/* content */}
        <div className="p-2 space-y-1">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <Icon icon="mdi:email-outline" className="text-lg" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Correo</div>
              <div className="text-sm text-slate-700 font-medium">{user?.correo}</div>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100 mx-4 my-1"></div>

        {/* Actions List */}
        <div className="p-2 space-y-1">
          <button
            onClick={() => alert("Próximamente")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors group text-left"
          >
            <Icon icon="mdi:lock-reset" className="text-lg text-slate-400 group-hover:text-slate-600" />
            <span className="font-medium">Cambiar contraseña</span>
          </button>

          <button
            onClick={() => { onClose(); logout?.(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors group text-left"
          >
            <Icon icon="mdi:logout" className="text-lg text-red-400 group-hover:text-red-600" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </div>
  );
}
// Removed unused auxiliary components
