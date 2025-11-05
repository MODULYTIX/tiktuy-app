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

  return (
    <>
      <h2 className="text-2xl font-bold text-center text-[#1A237E] mb-1">
        Registrarse
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Crea una contraseña segura para acceder a la plataforma
      </p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5">
        <Inputx
          type="password"
          label="Contraseña"
          placeholder="Escriba aquí"
          value={password}
          onChange={(e) => onChangePassword(e.target.value)}
          required
        />
        <Inputx
          type="password"
          label="Confirmar Contraseña"
          placeholder="Escriba aquí"
          value={confirm}
          onChange={(e) => onChangeConfirm(e.target.value)}
          required
        />
      </div>

      {!passwordsMatch && confirm && (
        <p className="text-red-600 text-sm mt-2">
          Las contraseñas no coinciden
        </p>
      )}

      <div className="flex justify-center items-center gap-5 mt-4">
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
    </>
  );
}
