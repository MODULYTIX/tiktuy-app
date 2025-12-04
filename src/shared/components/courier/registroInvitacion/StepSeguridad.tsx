import Buttonx from "@/shared/common/Buttonx";
import { Inputx } from "@/shared/common/Inputx";

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
  password,
  confirm,
  onChangePassword,
  onChangeConfirm,
  onBack,
  onSubmit,
  loading,
  canSubmit,
}: Props) {
  const passwordsMatch = password === confirm;

  // Indicador simple de fuerza de contraseña según longitud
  let strengthLabel: string | null = null;
  let strengthClass = "";

  if (password.length > 0) {
    if (password.length < 8) {
      strengthLabel = "Contraseña débil";
      strengthClass = "bg-red-100 text-red-700";
    } else if (password.length < 12) {
      strengthLabel = "Contraseña media";
      strengthClass = "bg-yellow-100 text-yellow-700";
    } else {
      strengthLabel = "Contraseña fuerte";
      strengthClass = "bg-green-100 text-green-700";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#1A237E] tracking-wide">
          SEGURIDAD DE LA CUENTA
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Crea una contraseña segura para proteger el acceso a tu cuenta.
        </p>
        <p className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 uppercase mt-2">
          Paso final · Revisa bien tu contraseña
        </p>
      </div>

      {/* Card de seguridad */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-5 md:px-6 md:py-6 space-y-5">
        {/* Campos de contraseña */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Inputx
            type="password"
            withPasswordToggle
            label="Contraseña"
            placeholder="Escriba aquí"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            required
          />
          <Inputx
            type="password"
            withPasswordToggle
            label="Confirmar contraseña"
            placeholder="Escriba aquí"
            value={confirm}
            onChange={(e) => onChangeConfirm(e.target.value)}
            required
          />
        </div>

        {/* Mensaje de error de coincidencia */}
        {!passwordsMatch && confirm && (
          <p className="text-red-600 text-sm">
            Las contraseñas no coinciden. Verifica que ambas sean iguales.
          </p>
        )}

        {/* Indicador de fuerza + recomendaciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm text-gray-600">
          {/* Requisitos básicos */}
          <div className="space-y-1">
            <p className="font-semibold text-gray-700">Recomendaciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Mínimo 8 caracteres.</li>
              <li>Combina letras y números.</li>
              <li>Incluye al menos una mayúscula.</li>
            </ul>
          </div>

          {/* Buenas prácticas */}
          <div className="space-y-1">
            <p className="font-semibold text-gray-700">Buenas prácticas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>No uses tu nombre ni DNI.</li>
              <li>Evita contraseñas usadas en otros sitios.</li>
              <li>No compartas tu contraseña con nadie.</li>
            </ul>
          </div>

          {/* Fuerza de contraseña */}
          <div className="space-y-2">
            <p className="font-semibold text-gray-700">Estado de seguridad:</p>
            {strengthLabel ? (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${strengthClass}`}>
                {strengthLabel}
              </div>
            ) : (
              <p className="text-gray-500">
                Escribe una contraseña para ver su nivel de seguridad.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between items-center">
        <Buttonx
          label="Volver"
          icon="majesticons:arrow-left-line"
          variant="outlinedw"
          onClick={onBack}
        />
        <Buttonx
          label={loading ? "Registrando..." : "Registrarme"}
          icon="majesticons:arrow-right-line"
          iconPosition="right"
          variant="quartery"
          onClick={onSubmit}
          disabled={loading || !canSubmit || !passwordsMatch}
        />
      </div>
    </div>
  );
}
