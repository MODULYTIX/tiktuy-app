interface Props {
  password: string;
  confirm: string;
  onChangePassword: (v: string) => void;
  onChangeConfirm: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  canSubmit: boolean;
}

export default function StepSeguridad({
  password, confirm, onChangePassword, onChangeConfirm, onBack, onSubmit, loading, canSubmit,
}: Props) {
  // Validación para las contraseñas
  const passwordsMatch = password === confirm;

  return (
    <>
      <h2 className="text-2xl font-bold text-center text-[#1A237E] mb-1">
        Registrarse
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Crea una contraseña segura para acceder a la plataforma
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Escriba aquí"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Confirmar Contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Escriba aquí"
            value={confirm}
            onChange={(e) => onChangeConfirm(e.target.value)}
          />
        </div>
      </div>

      {/* Mensaje de error si las contraseñas no coinciden */}
      {!passwordsMatch && confirm && (
        <p className="text-red-600 text-sm mt-2">Las contraseñas no coinciden</p>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="border px-4 py-2 rounded text-sm hover:bg-gray-100"
        >
          ← Volver
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || !canSubmit || !passwordsMatch} // Deshabilitar si las contraseñas no coinciden
          className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm hover:bg-[#0d174f] disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>
      </div>
    </>
  );
}
