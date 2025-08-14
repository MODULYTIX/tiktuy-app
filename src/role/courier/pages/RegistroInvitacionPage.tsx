import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { registrarDesdeInvitacion } from "@/services/courier/panel_control/panel_control.api";
import type { RegistroInvitacionPayload } from "@/services/courier/panel_control/panel_control.types";
import StepDatosPersonales from "@/shared/components/courier/registroInvitacion/StepDatosPersonales";
import StepInformacionComercial from "@/shared/components/courier/registroInvitacion/StepInformacionComercial";
import StepSeguridad from "@/shared/components/courier/registroInvitacion/StepSeguridad";

type Step = 1 | 2 | 3;

const HOME_PATH = "/"; // ← si tu “inicio” es otro, cámbialo aquí (por ej. "/")

export default function RegistroInvitacionPage() {
  const [searchparams] = useSearchParams();
  const token = searchparams.get("token") || "";
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<RegistroInvitacionPayload, "token">>({
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
    confirmar_contrasena: "", // lo llenaremos al enviar con confirmPassword
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  // Validación de las contraseñas
  const canSubmit = useMemo(() => {
    return form.contrasena.length >= 6 && form.contrasena === confirmPassword;
  }, [form.contrasena, confirmPassword]);

  const canContinue1 = useMemo(() => {
    const { nombres, apellidos, dni_ci, telefono, correo } = form;
    return (
      nombres.trim() &&
      apellidos.trim() &&
      dni_ci.trim() &&
      telefono.trim() &&
      correo.trim()
    );
  }, [form]);

  const canContinue2 = useMemo(() => {
    const { nombre_comercial, ruc, ciudad, direccion, rubro } = form;
    return (
      nombre_comercial.trim() &&
      ruc.trim() &&
      ciudad.trim() &&
      direccion.trim() &&
      rubro.trim()
    );
  }, [form]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded shadow p-6">
          <p className="text-red-600">Enlace inválido o falta el token de invitación.</p>
        </div>
      </div>
    );
  }

  async function onSubmit() {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!canSubmit) {
      setErrorMsg("Verifica tu contraseña (mín. 6 caracteres y deben coincidir).");
      return;
    }

    try {
      setLoading(true);
      // nos aseguramos que confirmar_contrasena vaya sincronizado con confirmPassword
      const payload: RegistroInvitacionPayload = {
        token,
        ...form,
        confirmar_contrasena: confirmPassword,
      };
      const res = await registrarDesdeInvitacion(payload);

      if (res.ok) {
        const msg = res.data.mensaje || "¡Ecommerce registrado correctamente!";
        setSuccessMsg(`${msg} Redirigiendo al inicio...`);
        window.scrollTo({ top: 0, behavior: "smooth" });

        // ⬅️ redirección al inicio después de un pequeño delay para que se vea el mensaje
        setTimeout(() => {
          navigate(HOME_PATH, { replace: true });
        }, 1500);
      } else {
        setErrorMsg(res.error || "No se pudo completar el registro.");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        {/* Barra de progreso */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex-1 h-2 rounded ${step >= 1 ? "bg-blue-800" : "bg-gray-200"}`} />
          <div className="w-6" />
          <div className={`flex-1 h-2 rounded ${step >= 2 ? "bg-blue-800" : "bg-gray-200"}`} />
          <div className="w-6" />
          <div className={`flex-1 h-2 rounded ${step >= 3 ? "bg-blue-800" : "bg-gray-200"}`} />
        </div>

        {/* Mensaje de error o éxito */}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {successMsg}
          </div>
        )}

        {/* Paso 1 */}
        {step === 1 && (
          <StepDatosPersonales
            values={form}
            onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
            onNext={() => canContinue1 && setStep(2)}
          />
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <StepInformacionComercial
            values={form}
            onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
            onBack={() => setStep(1)}
            onNext={() => canContinue2 && setStep(3)}
          />
        )}

        {/* Paso 3 */}
        {step === 3 && (
          <StepSeguridad
            password={form.contrasena}
            confirm={confirmPassword}
            onChangePassword={(v) => setForm((p) => ({ ...p, contrasena: v }))}
            onChangeConfirm={setConfirmPassword}
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
