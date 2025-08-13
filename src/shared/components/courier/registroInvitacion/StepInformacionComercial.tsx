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
  values, onChange, onBack, onNext,
}: Props) {
  const set =
    (k: keyof Props["values"]) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ [k]: e.target.value });

  return (
    <>
      <h2 className="text-2xl font-bold text-center text-[#1A237E] mb-1">
        Información Comercial
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Cuéntanos sobre tu ecommerce para configurar tu perfil comercial
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Nombre Comercial</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. Electrosur"
                 value={values.nombre_comercial} onChange={set("nombre_comercial")} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">RUC</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. 10234567891"
                 value={values.ruc} onChange={set("ruc")} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Rubro</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. Electricidad"
                 value={values.rubro} onChange={set("rubro")} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Ciudad</label>
          <select className="w-full border rounded px-3 py-2 text-sm"
                  value={values.ciudad} onChange={set("ciudad")}>
            <option value="">Seleccionar ciudad</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Dirección</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. Av. Belgrano"
                 value={values.direccion} onChange={set("direccion")} />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack}
                className="border px-4 py-2 rounded text-sm hover:bg-gray-100">
          ← Volver
        </button>
        <button onClick={onNext}
                className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm hover:bg-[#0d174f]">
          Siguiente →
        </button>
      </div>
    </>
  );
}
