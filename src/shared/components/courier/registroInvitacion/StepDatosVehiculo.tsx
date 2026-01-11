// src/shared/components/courier/registroInvitacion/StepDatosVehiculo.tsx
import { useState, useEffect } from "react";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";
import {
  type TipoVehiculo,
  type TipoVehiculoCatalogo,
} from "@/services/courier/panel_control/panel_control.types";
import { listarTiposVehiculo } from "@/services/courier/panel_control/panel_control.api";

type Values = {
  licencia: string;
  tipo_vehiculo: TipoVehiculo | null;
  placa: string;
};

type Props = {
  values: Values;
  onChange: (patch: Partial<Values>) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function StepDatosVehiculo({
  values,
  onChange,
  onBack,
  onNext,
}: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculoCatalogo[]>([]);

  useEffect(() => {
    // Cargar catálogo de tipos (sin token o con el que haya en sesión pública si aplica)
    listarTiposVehiculo()
      .then((res) => {
        if (res.ok) setTiposVehiculo(res.data);
      })
      .catch(console.error);
  }, []);

  const handleLicenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalizamos a mayúsculas y sin espacios extremos
    const v = e.target.value.toUpperCase();
    onChange({ licencia: v });
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalizamos a mayúsculas y limitamos un poco la longitud
    const v = e.target.value.toUpperCase().slice(0, 10);
    onChange({ placa: v });
  };

  function handleTipoVehiculoChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const v = e.target.value as "" | TipoVehiculo;
    onChange({ tipo_vehiculo: v === "" ? null : v });
  }

  const handleNextClick = () => {
    if (isProcessing) return;

    const errs: string[] = [];
    const { licencia, tipo_vehiculo, placa } = values;

    if (licencia.trim().length < 5) {
      errs.push("• Licencia: ingresa un número de licencia válido (mín. 5 caracteres).");
    }

    if (!tipo_vehiculo) {
      errs.push("• Tipo de vehículo: selecciona una opción.");
    }

    // Validación básica de placa: al menos 6 caracteres y sin espacios
    const placaTrim = placa.trim();
    if (placaTrim.length < 6) {
      errs.push("• Placa: ingresa una placa válida (mín. 6 caracteres, ej. XYZ-123).");
    }

    if (/\s/.test(placaTrim)) {
      errs.push("• Placa: no debe contener espacios.");
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
    setSuccessMsg("Datos del vehículo rellenados correctamente. Validando información...");
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
          DATOS DEL VEHÍCULO
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Ingresa los datos de tu vehículo para continuar con el registro.
        </p>
      </div>

      {/* Card de campos */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-5 md:px-6 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full">
            <Inputx
              label="Licencia"
              placeholder="Ejem. B123456"
              value={values.licencia}
              onChange={handleLicenciaChange}
              required
            />
          </div>

          <div className="w-full">
            <Selectx
              label="Tipo de vehículo"
              labelVariant="left"
              value={values.tipo_vehiculo ?? ""}
              onChange={handleTipoVehiculoChange}
              placeholder={tiposVehiculo.length ? "Seleccione..." : "Cargando..."}
              required
            >
              <option value="">Seleccione…</option>
              {tiposVehiculo.map((tv) => (
                <option key={tv.id} value={tv.descripcion}>
                  {tv.descripcion}
                </option>
              ))}
            </Selectx>
          </div>

          <div className="w-full md:col-span-2">
            <Inputx
              label="Placa"
              placeholder="Ejem. XYZ-123"
              value={values.placa}
              onChange={handlePlacaChange}
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
