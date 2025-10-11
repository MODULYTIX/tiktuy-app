import type { RegistroInvitacionPayload } from "@/services/courier/panel_control/panel_control.types";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";

type Values = Omit<RegistroInvitacionPayload, "token" | "contrasena" |
  "nombre_comercial" | "ruc" | "ciudad" | "direccion" | "rubro">;

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

export default function StepDatosPersonales({ values, onChange, onNext }: Props) {
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ [k]: e.target.value });

  return (
    <>
      <h2 className="text-2xl font-bold text-center text-[#1A237E] mb-1">
        DATOS PERSONALES
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Completa tus datos personales para crear tu cuenta de ecommerce
      </p>

      <div className="flex flex-col justify-center items-center gap-5">
        <div className="w-full flex flex-col-3 items-center gap-5">
          <Inputx
            label="Nombres"
            placeholder="Escriba aquí"
            value={values.nombres}
            onChange={set("nombres")}
            required
          />
          <Inputx
            label="Apellidos"
            placeholder="Ejem. Maguiña"
            value={values.apellidos}
            onChange={set("apellidos")}
            required
          />
          <Inputx
            label="DNI / CI"
            placeholder="Ejem. 87654321"
            value={values.dni_ci}
            onChange={set("dni_ci")}
            required
          />
        </div>
        <div className="flex flex-col-2 items-center gap-5">
          <InputxPhone
            label="Celular"
            countryCode="+51"
            name="telefono"
            placeholder="Ejem. 987654321"
            value={values.telefono}
            onChange={set("telefono")}
            required
          />
          <Inputx
            label="Correo"
            placeholder="correo@gmail.com"
            value={values.correo}
            onChange={set("correo")}
            required
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Buttonx
        label="Siguiente"
        icon="majesticons:arrow-right-line"
        iconPosition="right"
        variant="quartery"
        onClick={onNext}
        />
      </div>
    </>
  );
}