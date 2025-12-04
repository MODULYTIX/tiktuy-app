// src/pages/RegistroInvitacionPage.tsx
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import BackgroundImage from "@/assets/images/login-background.webp";

import {
  registrarDesdeInvitacion,
  registrarDesdeInvitacionMotorizado,
} from "@/services/courier/panel_control/panel_control.api";

import type {
  RegistroInvitacionPayload,
  RegistroInvitacionMotorizadoPayload,
  TipoVehiculo,
} from "@/services/courier/panel_control/panel_control.types";

// Steps
import StepDatosPersonales from "@/shared/components/courier/registroInvitacion/StepDatosPersonales";
import StepInformacionComercial from "@/shared/components/courier/registroInvitacion/StepInformacionComercial";
import StepDatosVehiculo from "@/shared/components/courier/registroInvitacion/StepDatosVehiculo";
import StepSeguridad from "@/shared/components/courier/registroInvitacion/StepSeguridad";

/* ---------------------------------- Const --------------------------------- */

// Evita enum (problema con `erasableSyntaxOnly`)
const STEP = { One: 1, Two: 2, Three: 3 } as const;
type StepValue = (typeof STEP)[keyof typeof STEP];

const LOGIN_PATH = "/login";

/* --------------------------------- Tipos ---------------------------------- */

type DatosPersonalesPatch = Partial<
  Pick<
    RegistroInvitacionPayload,
    "nombres" | "apellidos" | "dni_ci" | "telefono" | "correo"
  >
>;

type InfoComercialPatch = Partial<
  Pick<
    RegistroInvitacionPayload,
    "nombre_comercial" | "ruc" | "ciudad" | "direccion" | "rubro"
  >
>;

type FormMotorizadoLocal = Omit<
  RegistroInvitacionMotorizadoPayload,
  "token" | "tipo_vehiculo"
> & { tipo_vehiculo: TipoVehiculo | null };

type VehiculoValues = {
  licencia: string;
  tipo_vehiculo: TipoVehiculo | null;
  placa: string;
};

/* ------------------------------- Utilidades ------------------------------- */

const hasAllPersonalFields = (v: {
  nombres: string;
  apellidos: string;
  dni_ci: string;
  telefono: string;
  correo: string;
}) => {
  const nombresOk = v.nombres.trim().length > 1;
  const apellidosOk = v.apellidos.trim().length > 1;

  // DNI: exactamente 8 dígitos
  const dni = v.dni_ci.trim();
  const dniOk = /^\d{8}$/.test(dni);

  // Celular Perú: exactamente 9 dígitos
  const tel = v.telefono.trim();
  const telOk = /^\d{9}$/.test(tel);

  // Correo con formato básico válido
  const email = v.correo.trim();
  const emailOk = /\S+@\S+\.\S+/.test(email);

  return nombresOk && apellidosOk && dniOk && telOk && emailOk;
};

/* ------------------------ UI: Pantalla de Éxito --------------------------- */

function SuccessScreen({
  label,
  name,
  description,
  onGoLogin,
}: {
  label: string;
  name: string;
  description: string;
  onGoLogin: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white px-4 bg-center bg-cover bg-no-repeat min-w-screen"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="w-full max-w-3xl text-center">
        {/* Escudo */}
        <div className="mx-auto mb-4">
          <svg width="120" height="120" viewBox="0 0 24 24" className="mx-auto">
            <path
              fill="#FACC15"
              d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z"
            />
            <path
              fill="#FFF"
              d="M10.5 14.5l-2.5-2.5l1.4-1.4l1.1 1.1l4-4l1.4 1.4z"
            />
          </svg>
        </div>

        <p className="text-2xl text-gray-600">
          {label}:{" "}
          <span className="font-semibold text-4xl text-yellow-500 break-words">
            {name}
          </span>
        </p>

        <h2 className="mt-6 text-3xl font-extrabold text-blue-600">
          ¡Felicidades, por tu registro!
        </h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">{description}</p>

        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={onGoLogin}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-5 py-2.5 text-white text-sm font-medium hover:bg-black"
          >
            Ir a iniciar sesión
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="M10 17l5-5l-5-5v10zM4 4h2v16H4z" />
            </svg>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-green-600">
          <span className="text-xl">✔</span>
          <span className="text-sm">Paso 3 de 3 completados</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Componente -------------------------------- */

export default function RegistroInvitacionPage() {
  // Router
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const tipoQS = (sp.get("tipo") || "").toLowerCase();

  // /registro-invitacion-motorizado o ?tipo=motorizado|repartidor
  const isMotorizado =
    /registro-invitacion-(motorizado|repartidor)/.test(path) ||
    tipoQS === "motorizado" ||
    tipoQS === "repartidor";

  // Estado UI
  const [step, setStep] = useState<StepValue>(STEP.One);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Éxito
  const [finished, setFinished] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  // Formularios
  const [formE, setFormE] = useState<Omit<RegistroInvitacionPayload, "token">>({
    nombres: "",
    apellidos: "",
    dni_ci: "",
    telefono: "",
    correo: "",
    nombre_comercial: "",
    ruc: "",
    ciudad: "",
    direccion: "",
    rubro: "",
    contrasena: "",
    confirmar_contrasena: "",
  });

  const [formM, setFormM] = useState<FormMotorizadoLocal>({
    nombres: "",
    apellidos: "",
    dni_ci: "",
    telefono: "",
    correo: "",
    licencia: "",
    tipo_vehiculo: null,
    placa: "",
    contrasena: "",
    confirmar_contrasena: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  // Derivados
  const canContinue1 = useMemo(
    () =>
      isMotorizado ? hasAllPersonalFields(formM) : hasAllPersonalFields(formE),
    [isMotorizado, formE, formM]
  );

  const canContinue2 = useMemo(() => {
    if (isMotorizado) {
      const { licencia, tipo_vehiculo, placa } = formM;
      return Boolean(licencia.trim() && placa.trim() && tipo_vehiculo !== null);
    }
    const { nombre_comercial, ruc, ciudad, direccion, rubro } = formE;
    return Boolean(
      nombre_comercial.trim() &&
        ruc.trim() &&
        ciudad.trim() &&
        direccion.trim() &&
        rubro.trim()
    );
  }, [isMotorizado, formE, formM]);

  const canSubmit = useMemo(() => {
    const pwd = isMotorizado ? formM.contrasena : formE.contrasena;
    return pwd.length >= 6 && pwd === confirmPassword;
  }, [isMotorizado, formE.contrasena, formM.contrasena, confirmPassword]);

  // Handlers
  const handleVehiculoChange = useCallback(
    (patch: Partial<VehiculoValues>) =>
      setFormM((prev) => ({ ...prev, ...patch })),
    []
  );

  const onGoLogin = useCallback(() => navigate(LOGIN_PATH), [navigate]);

  const onSubmit = useCallback(async () => {
    setErrorMsg(null);

    if (!canSubmit) {
      setErrorMsg(
        "Verifica tu contraseña (mín. 6 caracteres y deben coincidir)."
      );
      return;
    }

    try {
      setLoading(true);

      if (isMotorizado) {
        if (formM.tipo_vehiculo === null) {
          setErrorMsg("Selecciona el tipo de vehículo.");
          return;
        }

        const payload: RegistroInvitacionMotorizadoPayload = {
          token,
          ...formM,
          tipo_vehiculo: formM.tipo_vehiculo,
          confirmar_contrasena: confirmPassword,
        };

        const res = await registrarDesdeInvitacionMotorizado(payload);
        if (res.ok) {
          setDisplayName(formM.nombres || "Tu cuenta");
          setFinished(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setErrorMsg(
            res.error || "No se pudo completar el registro del motorizado."
          );
        }
      } else {
        const payload: RegistroInvitacionPayload = {
          token,
          ...formE,
          confirmar_contrasena: confirmPassword,
        };

        const res = await registrarDesdeInvitacion(payload);
        if (res.ok) {
          setDisplayName(formE.nombre_comercial || "Tu ecommerce");
          setFinished(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setErrorMsg(res.error || "No se pudo completar el registro.");
        }
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, isMotorizado, formM, formE, token, confirmPassword]);

  // Guard clauses
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded shadow p-6">
          <p className="text-red-600">
            Enlace inválido o falta el token de invitación.
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    const label = isMotorizado ? "Nombre del Repartidor" : "Nombre comercial";
    const description = isMotorizado
      ? "Has sido registrado exitosamente en nuestra plataforma de fulfillment. Ahora podrás gestionar tus envíos y clientes de forma más eficiente."
      : "Tu ecommerce ha sido registrado exitosamente en nuestra plataforma de fulfillment. Ahora podrás gestionar tus pedidos, envíos y clientes de forma más eficiente.";

    return (
      <SuccessScreen
        label={label}
        name={displayName}
        description={description}
        onGoLogin={onGoLogin}
      />
    );
  }

  // Wizard
  return (
  <div
    className="min-h-screen w-full flex items-center justify-center px-4 bg-center bg-cover bg-no-repeat relative"
    style={{ backgroundImage: `url(${BackgroundImage})` }}
  >
    {/* Overlay para suavizar el fondo */}
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

    <div className="w-full max-w-6xl h-auto bg-white rounded-3xl shadow-2xl p-8 md:p-10 lg:p-12 z-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-[#1A237E] uppercase">
          {isMotorizado ? "Registro de Motorizado" : "Registro de Ecommerce"}
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Completa los pasos para finalizar tu registro.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          {/* Paso 1 */}
          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-semibold transition-all duration-300
                ${
                  step >= STEP.One
                    ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
            >
              1
            </div>
            <div className="ml-3 hidden sm:block">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  step >= STEP.One ? "text-blue-700" : "text-gray-400"
                }`}
              >
                Datos personales
              </p>
            </div>
          </div>

          {/* Conector 1–2 */}
          <div
            className={`h-0.5 flex-1 mx-2 md:mx-4 rounded-full transition-all duration-300
              ${step >= STEP.Two ? "bg-blue-600" : "bg-gray-200"}`}
          />

          {/* Paso 2 */}
          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-semibold transition-all duration-300
                ${
                  step >= STEP.Two
                    ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
            >
              2
            </div>
            <div className="ml-3 hidden sm:block">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  step >= STEP.Two ? "text-blue-700" : "text-gray-400"
                }`}
              >
                {isMotorizado ? "Datos del vehículo" : "Info. comercial"}
              </p>
            </div>
          </div>

          {/* Conector 2–3 */}
          <div
            className={`h-0.5 flex-1 mx-2 md:mx-4 rounded-full transition-all duration-300
              ${step >= STEP.Three ? "bg-blue-600" : "bg-gray-200"}`}
          />

          {/* Paso 3 */}
          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-semibold transition-all duration-300
                ${
                  step >= STEP.Three
                    ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
            >
              3
            </div>
            <div className="ml-3 hidden sm:block">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  step >= STEP.Three ? "text-blue-700" : "text-gray-400"
                }`}
              >
                Seguridad
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {errorMsg}
        </div>
      )}

      {/* Paso 1 */}
      {step === STEP.One && (
        <StepDatosPersonales
          values={isMotorizado ? formM : formE}
          onChange={(patch: DatosPersonalesPatch) =>
            isMotorizado
              ? setFormM((p) => ({ ...p, ...patch }))
              : setFormE((p) => ({ ...p, ...patch }))
          }
          onNext={() => canContinue1 && setStep(STEP.Two)}
        />
      )}

      {/* Paso 2 */}
      {step === STEP.Two &&
        (isMotorizado ? (
          <StepDatosVehiculo
            values={{
              licencia: formM.licencia,
              tipo_vehiculo: formM.tipo_vehiculo,
              placa: formM.placa,
            }}
            onChange={handleVehiculoChange}
            onBack={() => setStep(STEP.One)}
            onNext={() => canContinue2 && setStep(STEP.Three)}
          />
        ) : (
          <StepInformacionComercial
            values={formE}
            onChange={(patch: InfoComercialPatch) =>
              setFormE((p) => ({ ...p, ...patch }))
            }
            onBack={() => setStep(STEP.One)}
            onNext={() => canContinue2 && setStep(STEP.Three)}
          />
        ))}

      {/* Paso 3 */}
      {step === STEP.Three && (
        <StepSeguridad
          password={isMotorizado ? formM.contrasena : formE.contrasena}
          confirm={confirmPassword}
          onChangePassword={(v) =>
            isMotorizado
              ? setFormM((p) => ({ ...p, contrasena: v }))
              : setFormE((p) => ({ ...p, contrasena: v }))
          }
          onChangeConfirm={setConfirmPassword}
          onBack={() => setStep(STEP.Two)}
          onSubmit={onSubmit}
          loading={loading}
          canSubmit={canSubmit}
        />
      )}
    </div>
  </div>
);
}
