import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';
import ReporteEntregas from '@/shared/components/ecommerce/reportes/ReporteEntregas';
import ReporteIngresos from '@/shared/components/ecommerce/reportes/ReporteIngresos';
import { useEffect, useState } from 'react';

type Vista = 'ingresos' | 'entregas';

export default function ReportesPage() {

  const [vista, setVista] = useState<Vista>(
    () => (localStorage.getItem('reportes_vista') as Vista) || 'ingresos'
  );

  useEffect(() => {
    localStorage.setItem('reportes_vista', vista);
  }, [vista]);

  const descripcionVista = {
    ingresos: 'Reporte de ingresos realizados.',
    entregas: 'Reporte de entregas realizadas.',
  } as const;

  return (
    <section className="mt-8">
      <div className='flex justify-between items-end pb-5 border-b border-gray30'>
        <Tittlex
          title="Reportes Page"
          description="Visualiza Reportes"
        />
        <div className="flex gap-3 items-center">
          <Buttonx
            label="Ingresos"
            icon="streamline-plump:graph-arrow-user-increase"
            variant={vista === 'ingresos' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('ingresos')}
          />
          <span className="w-[1px] h-10 bg-gray40" />
          <Buttonx
            label="Entregas"
            icon="hugeicons:truck-delivery"
            variant={vista === 'entregas' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('entregas')}
          />
        </div>
      </div>
      <div className="mt-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">
            {vista === 'ingresos' ? 'Ingresos' : 'Entregas'}
          </h2>
          <p className="text-gray60 text-sm">{descripcionVista[vista]}</p>
        </div>
      </div>
      {vista === 'ingresos' ? <ReporteIngresos /> : <ReporteEntregas />}
    </section>
  );
}
