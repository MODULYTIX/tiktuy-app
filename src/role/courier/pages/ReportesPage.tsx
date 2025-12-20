import { useEffect, useState } from "react";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

import ReporteIngresosC from "@/shared/components/courier/reportes/ReporteIngresosC";
import ReporteEntregasC from "@/shared/components/courier/reportes/ReporteEntregasC";

type Vista = "ingresos" | "entregas";

export default function ReportesCourierPage() {
  const [vista, setVista] = useState<Vista>(
    () => (localStorage.getItem("courier_reportes_vista") as Vista) || "entregas"
  );

  useEffect(() => {
    localStorage.setItem("courier_reportes_vista", vista);
  }, [vista]);

  const descripcionVista = {
    ingresos: "Reporte de ingresos generados por el courier.",
    entregas: "Reporte de entregas realizadas por el courier.",
  } as const;

  return (
    <section className="mt-8">
      {/* HEADER */}
      <div className="flex justify-between items-end pb-5 border-b border-gray30">
        <Tittlex
          title="Reportes Courier"
          description="Visualiza el desempeño del courier"
        />

        <div className="flex gap-3 items-center">
          <Buttonx
            label="Ingresos"
            icon="streamline-plump:graph-arrow-user-increase"
            variant={vista === "ingresos" ? "secondary" : "tertiary"}
            onClick={() => setVista("ingresos")}
          />

          <span className="w-[1px] h-10 bg-gray40" />

          <Buttonx
            label="Entregas"
            icon="hugeicons:truck-delivery"
            variant={vista === "entregas" ? "secondary" : "tertiary"}
            onClick={() => setVista("entregas")}
          />
        </div>
      </div>

      {/* SUBHEADER */}
      <div className="mt-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">
            {vista === "ingresos" ? "Ingresos" : "Entregas"}
          </h2>
          <p className="text-gray60 text-sm">
            {descripcionVista[vista]}
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      {vista === "ingresos" ? <ReporteIngresosC /> : <ReporteEntregasC />}
    </section>
  );
}
