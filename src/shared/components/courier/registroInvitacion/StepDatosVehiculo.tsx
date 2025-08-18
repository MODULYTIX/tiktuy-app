// src/shared/components/courier/registroInvitacion/StepDatosVehiculo.tsx
import { TIPOS_VEHICULO, type TipoVehiculo } from "@/services/courier/panel_control/panel_control.types";

type Values = {
  licencia: string;
  // Usa null para representar “sin seleccionar” (evita conflicto con union literal)
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
  const canContinue =
    values.licencia.trim().length > 0 &&
    values.placa.trim().length > 0 &&
    values.tipo_vehiculo !== null;

  function handleTipoVehiculoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as "" | TipoVehiculo;
    onChange({ tipo_vehiculo: v === "" ? null : v });
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Datos del vehículo</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Licencia</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            value={values.licencia}
            onChange={(e) => onChange({ licencia: e.target.value })}
            placeholder="ABC12345"
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Tipo de vehículo</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm bg-white"
            value={values.tipo_vehiculo ?? ""}  
            onChange={handleTipoVehiculoChange}
          >
            <option value="">Seleccione…</option>
            {TIPOS_VEHICULO.map((tv) => (
              <option key={tv} value={tv}>
                {tv}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Placa</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            value={values.placa}
            onChange={(e) => onChange({ placa: e.target.value })}
            placeholder="XYZ-123"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="border px-4 py-2 rounded text-sm hover:bg-gray-100"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
