import { PiGarageLight } from 'react-icons/pi';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/auth/context/useAuth';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import CrearAlmacenModal from '@/shared/components/ecommerce/CrearAlmacenModal';
import { FaEdit } from 'react-icons/fa';

const PAGE_SIZE = 5;

function formatDate(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function AlmacenPage() {
  const { token } = useAuth();
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [almacenEditando, setAlmacenEditando] = useState<Almacenamiento | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchAlmacenes(token);
      setAlmacenes(data);
    } catch (err) {
      console.error('Error al cargar almacenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [token]);

  // Paginación (modelo base)
  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(almacenes.length / PAGE_SIZE)),
    [almacenes.length]
  );

  const dataPaginada = useMemo(() => {
    const start = (paginaActual - 1) * PAGE_SIZE;
    return almacenes.slice(start, start + PAGE_SIZE);
  }, [almacenes, paginaActual]);

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPaginas <= maxButtons) {
      for (let i = 1; i <= totalPaginas; i++) pages.push(i);
    } else {
      let start = Math.max(1, paginaActual - 2);
      let end = Math.min(totalPaginas, paginaActual + 2);
      if (paginaActual <= 3) { start = 1; end = maxButtons; }
      else if (paginaActual >= totalPaginas - 2) { start = totalPaginas - (maxButtons - 1); end = totalPaginas; }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) { pages.unshift('...'); pages.unshift(1); }
      if (end < totalPaginas) { pages.push('...'); pages.push(totalPaginas); }
    }
    return pages;
  }, [paginaActual, totalPaginas]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPaginas || p === paginaActual) return;
    setPaginaActual(p);
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-primary">Almacén</h1>
        <button
          onClick={() => { setAlmacenEditando(null); setShowModal(true); }}
          className="text-white flex px-3 py-2 bg-[#1A253D] items-center gap-2 rounded-sm text-sm hover:opacity-90 transition"
        >
          <PiGarageLight size={18} />
          <span>Nuevo Almacén</span>
        </button>
      </div>

      <p className="text-gray-600 mb-4">Visualice su almacén y sus movimientos.</p>

      <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[20%]" /> {/* Nom. Almacén */}
                <col className="w-[15%]" /> {/* Depto */}
                <col className="w-[15%]" /> {/* Ciudad */}
                <col className="w-[25%]" /> {/* Dirección */}
                <col className="w-[15%]" /> {/* F. Creación */}
                <col className="w-[10%]" /> {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">Nom. Almacén</th>
                  <th className="px-4 py-3 text-left">Departamento</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">F. Creación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <tr key={`sk-${idx}`} className="[&>td]:px-4 [&>td]:py-3 [&>td]:h-12 animate-pulse">
                      {Array.from({ length: 6 }).map((__, i) => (
                        <td key={`sk-${idx}-${i}`}><div className="h-4 bg-gray20 rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                ) : dataPaginada.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray70 italic">
                      No hay almacenes registrados
                    </td>
                  </tr>
                ) : (
                  <>
                    {dataPaginada.map((alm) => (
                      <tr key={alm.uuid} className="hover:bg-gray10 transition-colors">
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{alm.nombre_almacen}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{alm.departamento}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{alm.ciudad}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{alm.direccion}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{formatDate(alm.fecha_registro)}</td>
                        <td className="h-12 px-4 py-3">
                          <div className="flex items-center justify-center">
                            <FaEdit
                              size={18}
                              className="text-amber-600 hover:text-amber-800 cursor-pointer transition-colors"
                              title="Editar"
                              onClick={() => { setAlmacenEditando(alm); setShowModal(true); }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, PAGE_SIZE - dataPaginada.length) }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent">
                        {Array.from({ length: 6 }).map((__, i) => (
                          <td key={i} className="h-12 px-4 py-3">&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador (modelo base) */}
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => goToPage(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &lt;
            </button>

            {pagerItems.map((p, i) =>
              typeof p === 'string' ? (
                <span key={`dots-${i}`} className="px-2 text-gray70">{p}</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={paginaActual === p ? 'page' : undefined}
                  className={[
                    'w-8 h-8 flex items-center justify-center rounded',
                    paginaActual === p ? 'bg-gray90 text-white' : 'bg-gray10 text-gray70 hover:bg-gray20',
                  ].join(' ')}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        </section>
      </div>

      {showModal && token && (
        <CrearAlmacenModal
          token={token}
          almacen={almacenEditando}
          modo={almacenEditando ? 'editar' : 'crear'}
          onClose={() => { setShowModal(false); setAlmacenEditando(null); }}
          onSuccess={(nuevo) => {
            setAlmacenes((prev) => {
              const existe = prev.some((a) => a.uuid === nuevo.uuid);
              return existe ? prev.map((a) => (a.uuid === nuevo.uuid ? nuevo : a)) : [nuevo, ...prev];
            });
            setPaginaActual(1);
          }}
        />
      )}
    </section>
  );
}
