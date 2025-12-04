import { useState } from "react";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";

interface Props {
  values: {
    nombre_comercial: string;
    ruc: string;
    ciudad: string;
    direccion: string;
    rubro: string;
  };
  onChange: (patch: Partial<Props["values"]>) => void;
  onBack: () => void;
  onNext: () => void;
}

const CITIES = ["Arequipa", "Lima", "Cusco", "Tacna", "Moquegua"];

export default function StepInformacionComercial({
  values,
  onChange,
  onBack,
  onNext,
}: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const set =
    (k: keyof Props["values"]) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ [k]: e.target.value });

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 11);
    onChange({ ruc: soloDigitos });
  };

  const handleNextClick = () => {
    if (isProcessing) return;

    const errs: string[] = [];
    const { nombre_comercial, ruc, ciudad, direccion, rubro } = values;

    if (nombre_comercial.trim().length < 2) {
      errs.push("• Nombre comercial: ingresa al menos 2 caracteres.");
    }

    if (!/^\d{11}$/.test(ruc.trim())) {
      errs.push("• RUC: debe tener exactamente 11 dígitos numéricos.");
    }

    if (!ciudad.trim()) {
      errs.push("• Ciudad: selecciona una ciudad.");
    }

    if (direccion.trim().length < 5) {
      errs.push("• Dirección: ingresa una dirección más detallada (mín. 5 caracteres).");
    }

    if (rubro.trim().length < 3) {
      errs.push("• Rubro: describe el rubro con al menos 3 caracteres (ej. Electricidad).");
    }

    if (errs.length > 0) {
      setSuccessMsg(null);
      setErrorMsg(
        "Por favor revisa los siguientes campos antes de continuar:\n" +
          errs.join("\n")
      );
      return;
    }

    setErrorMsg(null);
    setSuccessMsg("Información comercial rellenada correctamente. Validando información...");
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMsg(null);
      onNext();
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Título + descripción */}
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#1A237E] tracking-wide">
          INFORMACIÓN COMERCIAL
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Cuéntanos sobre tu ecommerce para configurar tu perfil comercial.
        </p>
      </div>

      {/* Card de campos */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-5 md:px-6 md:py-6">
        {/* Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="w-full">
            <Inputx
              label="Nombre Comercial"
              placeholder="Ejem. Electrosur"
              value={values.nombre_comercial}
              onChange={set("nombre_comercial")}
              required
            />
          </div>
          <div className="w-full">
            <Inputx
              label="RUC"
              placeholder="Ejem. 10234567891 (11 dígitos)"
              value={values.ruc}
              onChange={handleRucChange}
              inputMode="numeric"
              maxLength={11}
              required
            />
          </div>
          <div className="w-full">
            <Inputx
              label="Rubro"
              placeholder="Ejem. Electricidad, Moda, Tecnología..."
              value={values.rubro}
              onChange={set("rubro")}
              required
            />
          </div>
        </div>

        {/* Fila 2 */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full">
            <Selectx
              label="Ciudad"
              labelVariant="left"
              value={values.ciudad}
              onChange={set("ciudad")}
              placeholder="Seleccionar ciudad"
              required
            >
              <option value="">Seleccionar ciudad</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Selectx>
          </div>
          <div className="w-full">
            <Inputx
              label="Dirección"
              placeholder="Ejem. Av. Belgrano 123, Piso 2"
              value={values.direccion}
              onChange={set("direccion")}
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

      {/* Botones */}
      <div className="flex justify-between items-center">
        <Buttonx
          label="Volver"
          icon="majesticons:arrow-left-line"
          variant="outlinedw"
          onClick={onBack}
        />
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
