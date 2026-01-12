import { useState } from "react";
import type { RegistroInvitacionPayload } from "@/services/courier/panel_control/panel_control.types";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";

type Values = Omit<
  RegistroInvitacionPayload,
  | "token"
  | "contrasena"
  | "nombre_comercial"
  | "ruc"
  | "ciudad"
  | "direccion"
  | "rubro"
>;

interface Props {
  values: {
    nombres: string;
    apellidos: string;
    dni_ci: string;
    telefono: string;
    correo: string;
  };
  onChange: (patch: Partial<Values>) => void;
  onNext: () => void;
}

export default function StepDatosPersonales({
  values,
  onChange,
  onNext,
}: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const set =
    (k: keyof Values) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange({ [k]: e.target.value });

  // 👉 Solo números y máximo 8 dígitos para DNI
  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 8);
    onChange({ dni_ci: soloDigitos } as Partial<Values>);
  };

  // 👉 Solo números y máximo 9 dígitos para celular
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange({ telefono: soloDigitos } as Partial<Values>);
  };

  const handleTelefonoPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const soloDigitos = pasted.replace(/\D/g, "").slice(0, 9);
    onChange({ telefono: soloDigitos } as Partial<Values>);
  };

  const handleNextClick = () => {
    if (isProcessing) return; // evita doble click mientras valida

    const errs: string[] = [];
    const { nombres, apellidos, dni_ci, telefono, correo } = values;

    if (nombres.trim().length < 2) {
      errs.push("• Nombres: ingresa al menos 2 caracteres.");
    }

    if (apellidos.trim().length < 2) {
      errs.push("• Apellidos: ingresa al menos 2 caracteres.");
    }

    if (!/^\d{8}$/.test(dni_ci.trim())) {
      errs.push("• DNI / CI: debe tener exactamente 8 dígitos numéricos.");
    }

    if (!/^\d{9}$/.test(telefono.trim())) {
      errs.push("• Celular: debe tener exactamente 9 dígitos numéricos.");
    }

    const emailTrim = correo.trim();
    if (!emailTrim || !/\S+@\S+\.\S+/.test(emailTrim)) {
      errs.push("• Correo: ingresa un correo válido (ej. nombre@correo.com).");
    }

    if (errs.length > 0) {
      setSuccessMsg(null);
      setErrorMsg(
        "Por favor revisa los siguientes campos antes de continuar:\n" +
        errs.join("\n")
      );
      return;
    }

    // Todo OK ✅
    setErrorMsg(null);
    setSuccessMsg("Datos rellenados correctamente. Validando información...");
    setIsProcessing(true);

    // Pequeño delay para dar sensación de validación moderna
    setTimeout(() => {
      setIsProcessing(false);
      // Puedes dejar o limpiar el mensaje; aquí lo limpiamos al avanzar
      setSuccessMsg(null);
      onNext();
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Título + descripción */}
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#1A237E] tracking-wide">
          DATOS PERSONALES
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Completa tus datos personales para crear tu cuenta de ecommerce.
        </p>
      </div>

      {/* Contenedor de campos */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-5 md:px-6 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="w-full">
            <Inputx
              label="Nombres"
              placeholder="Ingresa tus nombres"
              value={values.nombres}
              onChange={set("nombres")}
              required
            />
          </div>
          <div className="w-full">
            <Inputx
              label="Apellidos"
              placeholder="Ingresa tus apellidos"
              value={values.apellidos}
              onChange={set("apellidos")}
              required
            />
          </div>
          <div className="w-full">
            <Inputx
              label="DNI / CI"
              placeholder="Ejem. 87654321 (8 dígitos)"
              value={values.dni_ci}
              onChange={handleDniChange}
              inputMode="numeric"
              maxLength={8}
              required
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full">
            <InputxPhone
              label="Celular"
              countryCode="+51"
              name="telefono"
              placeholder="Ejem. 987654321 (9 dígitos)"
              value={values.telefono}
              onChange={handleTelefonoChange}
              onPaste={handleTelefonoPaste}
              maxLength={9}
              required
            />
          </div>
          <div className="w-full">
            <Inputx
              label="Correo"
              placeholder="Ejem. nombre@correo.com"
              value={values.correo}
              onChange={set("correo")}
              type="email"
              required
            />
          </div>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 whitespace-pre-line">
            {errorMsg}
          </div>
        )}

        {successMsg && !errorMsg && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Botón siguiente */}
      <div className="flex justify-end">
        <Buttonx
          label={isProcessing ? "Validando..." : "Siguiente"}
          icon="majesticons:arrow-right-line"
          iconPosition="right"
          variant="quartery"
          onClick={handleNextClick}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}
