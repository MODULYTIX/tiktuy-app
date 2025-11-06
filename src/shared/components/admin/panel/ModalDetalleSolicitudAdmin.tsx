// src/shared/components/admin/panel/modals/ModalDetalleSolicitud.tsx
import type { SolicitudCourier } from "@/role/user/service/solicitud-courier.types";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";
import Tittlex from "@/shared/common/Tittlex";


type Props = {
  open: boolean;
  data: SolicitudCourier;
  onClose: () => void;
};

export default function ModalDetalleSolicitud({ open, data, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 h-full w-[560px] max-w-[92vw] bg-white shadow-xl flex flex-col p-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="mdi:clipboard-text-outline"
          title="Detalle de la solicitud de Courier"
          description="Visualice la información registrada del courier seleccionado"
        />

        <div className="h-full flex flex-col gap-5">
          <div className="flex gap-5">
            <Inputx
              label="Nombre"
              placeholder="Ejem. Álvaro"
              value={data.nombres ?? "—"}
              disabled
            />
            <Inputx
              label="DNI / CI"
              placeholder="Ejem. 87654321"
              value={data.dni_ci ?? "—"}
              disabled
            />
          </div>

          <div className="flex gap-5">
            <Inputx
              label="Correo"
              placeholder="Ejem. correo@gmail.com"
              value={data.correo ?? "—"}
              disabled
            />
            <Inputx
              label="Ciudad"
              placeholder="Seleccionar ciudad"
              value={data.ciudad ?? "—"}
              disabled
            />
          </div>

          <div className="flex gap-5">
            <Inputx
              label="Apellido"
              placeholder="Ejem. Maguiña"
              value={
                data.apellido_paterno || data.apellido_materno
                  ? `${data.apellido_paterno ?? ""} ${data.apellido_materno ?? ""}`.trim()
                  : "—"
              }
              disabled
            />
            <InputxPhone
              label="Celular"
              placeholder="Ejem. 987654321"
              countryCode="+51"
              value={data.telefono ?? ""}
              disabled
            />
          </div>

          <div className="flex gap-5">
            <Inputx
              label="Nombre Comercial"
              placeholder="Ejem. Electrosur"
              value={data.courier ?? data.nombre_comercial ?? "—"}
              disabled
            />
            <Inputx
              label="Dirección"
              placeholder="Ejem. Av. Belgrano"
              value={data.direccion ?? "—"}
              disabled
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex w-full justify-start">
          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cerrar"
          />
        </div>
      </div>
    </div>
  );
}
