import type { SolicitudEcommerce } from "@/role/user/service/solicitud-ecommerce.types";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";
import Tittlex from "@/shared/common/Tittlex";

type Props = {
    open: boolean;
    data: SolicitudEcommerce;
    onClose: () => void;
};

export default function ModalDetalleSolicitudAdminEcommerce({ open, data, onClose }: Props) {
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
                    icon="mdi:store-outline"
                    title="Detalle de Ecommerce"
                    description="Visualice la información registrada del ecommerce seleccionado"
                />

                <div className="h-full flex flex-col gap-5">

                    <div className="flex gap-5">
                        <Inputx
                            label="Ecommerce"
                            placeholder="Ejm. MiTienda.pe"
                            value={data.ecommerce ?? "—"}
                            disabled
                        />
                        <Inputx
                            label="Rubro"
                            placeholder="Ejm. Ropa"
                            value={data.rubro ?? "—"}
                            disabled
                        />
                    </div>

                    <div className="flex gap-5">
                        <Inputx
                            label="Correo"
                            placeholder="Ejm. correo@gmail.com"
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
                        <InputxPhone
                            label="Celular"
                            placeholder="Ejm. 987654321"
                            countryCode="+51"
                            value={data.telefono ?? ""}
                            disabled
                        />
                        <Inputx
                            label="Dirección"
                            placeholder="Ejm. Av. Belgrano"
                            value={data.direccion ?? "—"}
                            disabled
                        />
                    </div>

                    <div className="flex gap-5">
                        <Inputx
                            label="Estado"
                            value={data.estado ?? "—"}
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
