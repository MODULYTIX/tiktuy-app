import { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaEye } from 'react-icons/fa';
import { Icon } from '@iconify/react';
import { Skeleton } from '../../ui/Skeleton';

interface CuadreSaldo {
  id: string;
  fecha_entrega: string;
  courier: string;
  ciudad: string;
  monto: number;
  concepto: string;
  estado: 'Validado' | 'Sin Validar';
}

const ROWS_PER_PAGE = 10;

export default function CuadreSaldoTable() {
  const [data, setData] = useState<CuadreSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filtros (solo UI)
  const [filtros, setFiltros] = useState({
    courier: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData([
        {
          id: '1',
          fecha_entrega: '28/07/2025',
          courier: 'Olva Courier',
          ciudad: 'Arequipa',
          monto: 3200,
          concepto: 'Venta del día',
          estado: 'Validado',
        },
        {
          id: '2',
          fecha_entrega: '28/07/2025',
          courier: 'DHL Express',
          ciudad: 'Puno',
          monto: 6000,
          concepto: 'Transferencia de la courier',
          estado: 'Sin Validar',
        },
        // ...agrega más si quieres ver la paginación
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Opciones dinámicas para selects (desde data)
  const couriers = useMemo(
    () => Array.from(new Set(data.map(d => d.courier))).filter(Boolean),
    [data]
  );
  const estados = ['Validado', 'Sin Validar'];

  // totalPages y pageData (modelo base)
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pageData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  }, [data, page]);

  // paginador (ventana 5 + elipsis)
  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (page <= 3) { start = 1; end = maxButtons; }
      else if (page >= totalPages - 2) { start = totalPages - (maxButtons - 1); end = totalPages; }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) { pages.unshift('...'); pages.unshift(1); }
      if (end < totalPages) { pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  // filas vacías para altura constante
  const emptyRows = !loading ? Math.max(0, ROWS_PER_PAGE - pageData.length) : 0;

  const renderEstado = (estado: CuadreSaldo['estado']) => {
    const base =
      'inline-flex items-center justify-center px-3 py-[6px] rounded-full text-[12px] font-medium shadow-sm whitespace-nowrap';
    return estado === 'Validado'
      ? <span className={`${base} bg-black text-white`}>Validado</span>
      : <span className={`${base} bg-gray30 text-gray80`}>Sin Validar</span>;
  };

  // Handlers UI filtros
  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
  const limpiarFiltros = () =>
    setFiltros({ courier: '', estado: '', fecha_desde: '', fecha_hasta: '' });

  return (
    <div className="mt-6">
      {/* Filtros — patrón base */}
      <div className="bg-white p-5 rounded shadow-default flex flex-wrap gap-4 items-end border-b-4 border-gray90 mb-5">
        {/* Courier */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-courier" className="text-sm font-medium text-gray70">Courier</label>
          <select
            id="f-courier"
            name="courier"
            value={filtros.courier}
            onChange={onSelectChange}
            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors"
          >
            <option value="">Todos</option>
            {couriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-estado" className="text-sm font-medium text-gray70">Estado</label>
          <select
            id="f-estado"
            name="estado"
            value={filtros.estado}
            onChange={onSelectChange}
            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors"
          >
            <option value="">Todos</option>
            {estados.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Desde */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-desde" className="text-sm font-medium text-gray70">Desde</label>
          <input
            id="f-desde"
            name="fecha_desde"
            type="date"
            value={filtros.fecha_desde}
            onChange={onDateChange}
            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors"
          />
        </div>

        {/* Hasta */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-hasta" className="text-sm font-medium text-gray70">Hasta</label>
          <input
            id="f-hasta"
            name="fecha_hasta"
            type="date"
            value={filtros.fecha_hasta}
            onChange={onDateChange}
            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors"
          />
        </div>

        {/* Limpiar filtros */}
        <button
          onClick={limpiarFiltros}
          type="button"
          className="flex items-center gap-2 bg-gray10 border border-gray60 px-3 py-2 rounded text-gray60 text-sm hover:bg-gray-100"
        >
          <Icon icon="mynaui:delete" width="20" height="20" />
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla — patrón base */}
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              {/* colgroup (100%) */}
              <colgroup>
                <col className="w-[12%]" /> {/* Fec. Entrega */}
                <col className="w-[18%]" /> {/* Courier */}
                <col className="w-[14%]" /> {/* Ciudad */}
                <col className="w-[12%]" /> {/* Monto */}
                <col className="w-[30%]" /> {/* Concepto */}
                <col className="w-[8%]" />  {/* Estado */}
                <col className="w-[6%]" />  {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">FEC. ENTREGA</th>
                  <th className="px-4 py-3 text-left">COURIER</th>
                  <th className="px-4 py-3 text-left">CIUDAD</th>
                  <th className="px-4 py-3 text-center">MONTO</th>
                  <th className="px-4 py-3 text-left">CONCEPTO</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {loading &&
                  Array.from({ length: ROWS_PER_PAGE }).map((_, idx) => (
                    <tr key={`sk-${idx}`} className="hover:bg-transparent">
                      {Array.from({ length: 7 }).map((__, i) => (
                        <td key={i} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!loading &&
                  pageData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray10 transition-colors">
                      <td className="px-4 py-3 text-gray70 font-[400]">{item.fecha_entrega}</td>
                      <td className="px-4 py-3 text-gray70 font-[400]">{item.courier}</td>
                      <td className="px-4 py-3 text-gray70 font-[400]">{item.ciudad}</td>
                      <td className="px-4 py-3 text-center text-gray70 font-[400]">
                        S/ {item.monto.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray70 font-[400]">{item.concepto}</td>
                      <td className="px-4 py-3 text-center">{renderEstado(item.estado)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          {item.estado === 'Sin Validar' && (
                            <button
                              className="text-green-600 hover:text-green-700"
                              title="Validar"
                              aria-label={`Validar ${item.id}`}
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalle"
                            aria-label={`Ver ${item.id}`}
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && emptyRows > 0 &&
                  Array.from({ length: emptyRows }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="hover:bg-transparent">
                      {Array.from({ length: 7 }).map((__, i) => (
                        <td key={i} className="px-4 py-3">&nbsp;</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Paginador base — visible si hay datos */}
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
              >
                &lt;
              </button>

              {pagerItems.map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`dots-${i}`} className="px-2 text-gray70">
                    {p}
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={page === p ? 'page' : undefined}
                    className={[
                      'w-8 h-8 flex items-center justify-center rounded',
                      page === p ? 'bg-gray90 text-white' : 'bg-gray10 text-gray70 hover:bg-gray20',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
