// src/pages/RegistroInvitacionPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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

type Step = 1 | 2 | 3;
const LOGIN_PATH = "/login";

/** Patches tipados (sin any) */
type DatosPersonalesPatch = Partial<
  Pick<RegistroInvitacionPayload, "nombres" | "apellidos" | "dni_ci" | "telefono" | "correo">
>;
type InfoComercialPatch = Partial<
  Pick<RegistroInvitacionPayload, "nombre_comercial" | "ruc" | "ciudad" | "direccion" | "rubro">
>;

/** Form local para motorizado: permite null hasta seleccionar tipo_vehiculo en UI */
type FormMotorizado = Omit<RegistroInvitacionMotorizadoPayload, "token" | "tipo_vehiculo"> & {
  tipo_vehiculo: TipoVehiculo | null;
};

/** Valores del StepDatosVehiculo (para tipar el handler sin fricción) */
type VehiculoValues = {
  licencia: string;
  tipo_vehiculo: TipoVehiculo | null;
  placa: string;
};

export default function RegistroInvitacionPage() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const [searchparams] = useSearchParams();
  const token = searchparams.get("token") || "";
  const tipoQS = (searchparams.get("tipo") || "").toLowerCase();

  // Acepta /registro-invitacion-motorizado o ?tipo=motorizado|repartidor
  const isMotorizado =
    /registro-invitacion-(motorizado|repartidor)/.test(path) ||
    tipoQS === "motorizado" ||
    tipoQS === "repartidor";

  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Nuevo: estado final + nombre a mostrar en banner
  const [finished, setFinished] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  // --------- Formularios ---------
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

  const [formM, setFormM] = useState<FormMotorizado>({
    nombres: "",
    apellidos: "",
    dni_ci: "",
    telefono: "",
    correo: "",
    licencia: "",
    tipo_vehiculo: null, // null hasta que el usuario seleccione
    placa: "",
    contrasena: "",
    confirmar_contrasena: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  // --------- Helpers de validación sin any ---------
  function hasAllPersonalFields(v: {
    nombres: string;
    apellidos: string;
    dni_ci: string;
    telefono: string;
    correo: string;
  }): boolean {
    return (
      v.nombres.trim().length > 0 &&
      v.apellidos.trim().length > 0 &&
      v.dni_ci.trim().length > 0 &&
      v.telefono.trim().length > 0 &&
      v.correo.trim().length > 0
    );
  }

  // --------- Reglas de navegación ---------
  const canSubmit = useMemo(() => {
    const pwd = isMotorizado ? formM.contrasena : formE.contrasena;
    return pwd.length >= 6 && pwd === confirmPassword;
  }, [isMotorizado, formE.contrasena, formM.contrasena, confirmPassword]);

  const canContinue1 = useMemo(
    () => (isMotorizado ? hasAllPersonalFields(formM) : hasAllPersonalFields(formE)),
    [isMotorizado, formE, formM]
  );

  const canContinue2 = useMemo(() => {
    if (isMotorizado) {
      const { licencia, tipo_vehiculo, placa } = formM;
      return (
        licencia.trim().length > 0 &&
        placa.trim().length > 0 &&
        tipo_vehiculo !== null
      );
    } else {
      const { nombre_comercial, ruc, ciudad, direccion, rubro } = formE;
      return (
        nombre_comercial.trim().length > 0 &&
        ruc.trim().length > 0 &&
        ciudad.trim().length > 0 &&
        direccion.trim().length > 0 &&
        rubro.trim().length > 0
      );
    }
  }, [isMotorizado, formE, formM]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded shadow p-6">
          <p className="text-red-600">Enlace inválido o falta el token de invitación.</p>
        </div>
      </div>
    );
  }

  // --------- Submit ---------
  async function onSubmit() {
    setErrorMsg(null);

    if (!canSubmit) {
      setErrorMsg("Verifica tu contraseña (mín. 6 caracteres y deben coincidir).");
      return;
    }

    try {
      setLoading(true);

      if (isMotorizado) {
        if (formM.tipo_vehiculo === null) {
          setErrorMsg("Selecciona el tipo de vehículo.");
          setLoading(false);
          return;
        }

        const payload: RegistroInvitacionMotorizadoPayload = {
          token,
          ...formM,
          tipo_vehiculo: formM.tipo_vehiculo, // ya asegurado como TipoVehiculo
          confirmar_contrasena: confirmPassword,
        };

        const res = await registrarDesdeInvitacionMotorizado(payload);
        if (res.ok) {
          setDisplayName(formM.nombres || "Tu cuenta");
          setFinished(true); // Mostrar pantalla final
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setErrorMsg(res.error || "No se pudo completar el registro del motorizado.");
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
          setFinished(true); // Mostrar pantalla final
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
  }

  // --------- Handler alineado con StepDatosVehiculo (sin any) ---------
  const handleVehiculoChange = (patch: Partial<VehiculoValues>) => {
    setFormM((prev) => ({ ...prev, ...patch }));
  };

  // --------- Pantalla de ÉXITO ---------
  if (finished) {
    const label = isMotorizado ? "Nombre del Repartidor" : "Nombre comercial";
    const description = isMotorizado
      ? "Has sido registrado exitosamente en nuestra plataforma de fulfillment. Ahora podrás gestionar tus envíos y clientes de forma más eficiente."
      : "Tu ecommerce ha sido registrado exitosamente en nuestra plataforma de fulfillment. Ahora podrás gestionar tus pedidos, envíos y clientes de forma más eficiente.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-3xl text-center">
          {/* Escudo */}
          <div className="mx-auto mb-4">
            <svg width="120" height="120" viewBox="0 0 24 24" className="mx-auto">
              <path fill="#FACC15" d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z"/>
              <path fill="#FFF" d="M10.5 14.5l-2.5-2.5l1.4-1.4l1.1 1.1l4-4l1.4 1.4z"/>
            </svg>
          </div>

          {/* Título superior */}
          <p className="text-2xl text-gray-600">
            {label}:{" "}
            <span className="font-semibold text-4xl text-yellow-500 break-words">
              {displayName}
            </span>
          </p>

          {/* Felicitación */}
          <h2 className="mt-6 text-3xl font-extrabold text-blue-600">
            ¡Felicidades, por tu registro!
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>

          {/* Botón único: ir a login */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => navigate(LOGIN_PATH)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-5 py-2.5 text-white text-sm font-medium hover:bg-black"
            >
              Ir a iniciar sesión
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M10 17l5-5l-5-5v10zM4 4h2v16H4z"/>
              </svg>
            </button>
          </div>

          {/* Paso completado */}
          <div className="mt-8 flex items-center justify-center gap-2 text-green-600">
            <span className="text-xl">✔</span>
            <span className="text-sm">Paso 3 de 3 completados</span>
          </div>
        </div>
      </div>
    );
  }

  // --------- Wizard (pasos 1–3) ---------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold text-[#1A237E] text-center mb-1 uppercase">
          {isMotorizado ? "Registro de Motorizado" : "Registro de Ecommerce"}
        </h1>
        <p className="text-center text-sm text-gray-600 mb-5">
          Completa los pasos para finalizar tu registro.
        </p>

        {/* Progreso */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex-1 h-2 rounded ${step >= 1 ? "bg-blue-800" : "bg-gray-200"}`} />
          <div className="w-6" />
          <div className={`flex-1 h-2 rounded ${step >= 2 ? "bg-blue-800" : "bg-gray-200"}`} />
          <div className="w-6" />
          <div className={`flex-1 h-2 rounded ${step >= 3 ? "bg-blue-800" : "bg-gray-200"}`} />
        </div>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </div>
        )}

        {/* Paso 1: Datos personales */}
        {step === 1 && (
          <StepDatosPersonales
            values={isMotorizado ? formM : formE}
            onChange={(patch: DatosPersonalesPatch) =>
              isMotorizado
                ? setFormM((p) => ({ ...p, ...patch }))
                : setFormE((p) => ({ ...p, ...patch }))
            }
            onNext={() => canContinue1 && setStep(2)}
          />
        )}

        {/* Paso 2 */}
        {step === 2 &&
          (isMotorizado ? (
            <StepDatosVehiculo
              values={{
                licencia: formM.licencia,
                tipo_vehiculo: formM.tipo_vehiculo,
                placa: formM.placa,
              }}
              onChange={handleVehiculoChange}
              onBack={() => setStep(1)}
              onNext={() => canContinue2 && setStep(3)}
            />
          ) : (
            <StepInformacionComercial
              values={formE}
              onChange={(patch: InfoComercialPatch) =>
                setFormE((p) => ({ ...p, ...patch }))
              }
              onBack={() => setStep(1)}
              onNext={() => canContinue2 && setStep(3)}
            />
          ))}

        {/* Paso 3: Seguridad */}
        {step === 3 && (
          <StepSeguridad
            password={isMotorizado ? formM.contrasena : formE.contrasena}
            confirm={confirmPassword}
            onChangePassword={(v: string) =>
              isMotorizado
                ? setFormM((p) => ({ ...p, contrasena: v }))
                : setFormE((p) => ({ ...p, contrasena: v }))
            }
            onChangeConfirm={(v: string) => setConfirmPassword(v)}
            onBack={() => setStep(2)}
            onSubmit={onSubmit}
            loading={loading}
            canSubmit={canSubmit}
          />
        )}
      </div>
    </div>
  );
}
