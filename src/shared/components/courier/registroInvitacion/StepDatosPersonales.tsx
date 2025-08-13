import type { RegistroInvitacionPayload } from "@/services/courier/panel_control/panel_control.types";

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Nombre</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. Álvaro"
                 value={values.nombres} onChange={set("nombres")} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Apellido</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. Maguiña"
                 value={values.apellidos} onChange={set("apellidos")} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">DNI / CI</label>
          <input className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="Ejem. 87654321"
                 value={values.dni_ci} onChange={set("dni_ci")} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Correo</label>
          <input type="email" className="w-full border rounded px-3 py-2 text-sm"
                 placeholder="correo@gmail.com"
                 value={values.correo} onChange={set("correo")} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Celular</label>
          <div className="flex items-center gap-2">
            <span className="px-2 py-2 border rounded text-sm bg-gray-100">+51</span>
            <input className="w-full border rounded px-3 py-2 text-sm"
                   placeholder="Ejem. 987654321"
                   value={values.telefono}
                   onChange={set("telefono")} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onNext}
                className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm hover:bg-[#0d174f]">
          Siguiente →
        </button>
      </div>
    </>
  );
}
