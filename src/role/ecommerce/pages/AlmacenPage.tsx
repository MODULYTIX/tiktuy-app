import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/auth/context/useAuth';
import { fetchAlmacenes, reenviarInvitacionRepresentante } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import CrearAlmacenModal from '@/shared/components/ecommerce/CrearAlmacenModal';
import { FaEdit } from 'react-icons/fa';
import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';

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

/** ============================
 *  Modal que desliza desde la DERECHA
 *  ============================ */
function ModalSlideRight({
  open,
  onClose,
  widthClass = 'w-[420px] max-w-[92vw]',
  children,
}: {
  open: boolean;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let r1 = 0, r2 = 0;
    let t: ReturnType<typeof setTimeout> | undefined;

    if (open) {
      setMounted(true);
      r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      t = setTimeout(() => setMounted(false), 320);
    }

    return () => {
      if (r1) cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
      if (t) clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className={[
          'absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out',
          show ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'absolute right-0 top-0 h-full bg-white shadow-lg border-l border-gray-200',
          widthClass,
          'transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          show ? 'translate-x-0' : 'translate-x-full',
          'flex flex-col',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function AlmacenPage() {
  const { token } = useAuth();
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [almacenEditando, setAlmacenEditando] = useState<Almacenamiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [reenviando, setReenviando] = useState<number | null>(null); // sedeId en reenvío

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchAlmacenes(token);
      setAlmacenes(data);
    } catch (err) {
      console.error('Error al cargar sedes:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Paginación
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

  const handleReenviarInvitacion = async (sedeId: number) => {
    if (!token) return;
    try {
      setReenviando(sedeId);
      const res = await reenviarInvitacionRepresentante(sedeId, token);
      // Puedes reemplazar alert por tu sistema de toasts
      alert(`Invitación reenviada a ${res.invitacion.correo}.`);
    } catch (e: any) {
      alert(e?.message || 'No se pudo reenviar la invitación.');
    } finally {
      setReenviando(null);
    }
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-end mb-4">
        <Tittlex
          title="Sedes"
          description="Visualice sus sedes y sus movimientos"
        />

        <Buttonx
          label="Nueva sede"
          icon="solar:garage-linear"
          variant="secondary"
          onClick={() => { setAlmacenEditando(null); setShowModal(true); }}
          className="font-light"
        />
      </div>

      <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[15%]" />
                <col className="w-[21%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">Nom. Sede</th>
                  <th className="px-4 py-3 text-left">Departamento</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">Representante</th>
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
                      No hay sedes registradas
                    </td>
                  </tr>
                ) : (
                  <>
                    {dataPaginada.map((alm) => (
                      <tr key={alm.uuid} className="hover:bg-gray10 transition-colors">
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">
                          <div className="flex items-center gap-2">
                            <span>{alm.nombre_almacen}</span>
                            {alm.es_principal ? (
                              <span className="px-2 py-[2px] text-[10px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Principal
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Creado: {formatDate(alm.fecha_registro)}
                          </div>
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">
                          {alm.departamento ?? '-'}
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{alm.ciudad}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{alm.direccion}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">
                          {alm.representante_usuario_id ? (
                            <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] bg-blue-100 text-blue-700 border border-blue-200">
                              Asignado
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] bg-amber-100 text-amber-700 border border-amber-200">
                                Pendiente
                              </span>
                              <button
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50"
                                onClick={() => handleReenviarInvitacion(alm.id)}
                                disabled={reenviando === alm.id}
                              >
                                {reenviando === alm.id ? 'Reenviando…' : 'Reenviar invitación'}
                              </button>
                            </div>
                          )}
                        </td>
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

          {/* Paginador */}
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

      {/* Modal con animación desde la DERECHA */}
      {token && (
        <ModalSlideRight
          open={showModal}
          onClose={() => { setShowModal(false); setAlmacenEditando(null); }}
          widthClass="w-[420px] max-w-[92vw]"
        >
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
        </ModalSlideRight>
      )}
    </section>
  );
}
