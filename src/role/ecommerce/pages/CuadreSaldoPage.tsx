import CuadreSaldoTable from '@/shared/components/ecommerce/cuadresaldo/CuadreSaldoTable';

export default function CuadreSaldoPage() {
  return (
    <section className='mt-8'>
      <div>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            Cuadre de Saldo
          </h1>
          <p className='text-gray-500'>Monitoreo de lo recaudado en el dia</p>
        </div>
        <div>
            <CuadreSaldoTable />
        </div>
      </div>
    </section>
  );
}
