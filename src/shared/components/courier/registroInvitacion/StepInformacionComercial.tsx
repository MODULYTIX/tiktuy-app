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
  values, onChange, onBack, onNext,
}: Props) {
  const set =
    (k: keyof Props["values"]) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        onChange({ [k]: e.target.value });

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="text-2xl font-bold text-center text-[#1A237E] mb-1">
        Información Comercial
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Cuéntanos sobre tu ecommerce para configurar tu perfil comercial
      </p>

      <div className="w-full flex flex-col justify-center items-center gap-5">
        <div className="w-full flex flex-col-3 items-center gap-5">
          <Inputx
            label="Nombre Comercial"
            placeholder="Ejem. Electrosur"
            value={values.nombre_comercial}
            onChange={set("nombre_comercial")}
            required
          />
          <Inputx
            label="RUC"
            placeholder="Ejem. 10234567891"
            value={values.ruc}
            onChange={set("ruc")}
            required
          />
          <Inputx
            label="Rubro"
            placeholder="Ejem. Electricidad"
            value={values.rubro}
            onChange={set("rubro")}
            required
          />
        </div>
        <div className="flex flex-col-2 items-center gap-5">
          <Selectx
            label="Ciudad"
            labelVariant="left"
            value={values.ciudad}
            onChange={set("ciudad")}
            placeholder="Seleccionar ciudad"
            required
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
                </option>
            ))}
          </Selectx>
          <Inputx
            label="Dirección"
            placeholder="Ejem. Av. Belgrano"
            value={values.direccion}
            onChange={set("direccion")}
            required
          />
        </div>
      </div>

      <div className="flex justify-center items-center gap-5">
        <Buttonx
          label="Volver"
          icon="majesticons:arrow-left-line"
          variant="outlinedw"
          onClick={onBack}
        />
        <Buttonx
          label="Siguiente"
          icon="majesticons:arrow-right-line"
          iconPosition="right"
          variant="quartery"
          onClick={onNext}
        />
      </div>
    </div>
  );
}
