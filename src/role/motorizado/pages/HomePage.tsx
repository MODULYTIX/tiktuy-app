// src/pages/motorizado/MotorizadoHomePage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '@/auth/context/useAuth';
import {
  getDisponibilidadRepartidor,
  setDisponibilidadRepartidor,
} from '@/services/repartidor/estado/estado.api';
import { fetchKpisMotorizado } from '@/services/repartidor/estado/dashboard.api';
import Tittlex from '@/shared/common/Tittlex';

type KPIs = {
  asignadosHoy: number;
  completados: number;
  pendientes: number;
  reprogramados: number;
};

const GESTION_PEDIDOS_PATH = '/motorizado/pedidos';

const isAbort = (e: unknown) =>
  (e as any)?.name === 'AbortError' || /aborted/i.test((e as any)?.message || '');

// ================== KPI CARD ==================
function KpiCard({
  title,
  value,
  icon,
  accent,
  disabled,
}: {
  title: string;
  value: number;
  icon: string;
  accent: 'blue' | 'green' | 'amber' | 'red';
  disabled?: boolean;
}) {
  const display = (disabled ? 0 : value).toString().padStart(2, '0');

  const c = {
    blue: { icon: 'text-blue-500', text: 'text-blue-600', border: 'border-blue-500', number: 'text-[28px] md:text-[30px]' },
    green: { icon: 'text-green-500', text: 'text-green-600', border: 'border-green-500', number: 'text-[28px] md:text-[30px]' },
    amber: { icon: 'text-amber-500', text: 'text-amber-600', border: 'border-amber-500', number: 'text-[28px] md:text-[30px]' },
    red: { icon: 'text-red-500', text: 'text-red-600', border: 'border-red-500', number: 'text-[28px] md:text-[30px]' },
  }[accent];

  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-4 shadow-[0_8px_14px_rgba(0,0,0,0.12)]">
      <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3">
        <div className="min-h-[76px] md:min-h-[80px] flex flex-col justify-between min-w-0">
          {/* Título con borde que crece con 1 o 2 líneas */}
          <div className={`min-w-0 pl-2 border-l-2 ${c.border}`}>
            <p
              className="text-[12.5px] leading-[1.15] font-medium text-gray-700 overflow-hidden"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              title={title}
            >
              {title}
            </p>
          </div>
          <p className={`mt-2 font-semibold leading-none tabular-nums ${c.number} ${c.text}`}>{display}</p>
        </div>

        {/* Icono ocupa el alto máximo de su celda */}
        <div className="h-[56px] md:h-[60px] flex items-center justify-center ml-1">
          <Icon icon={icon} height="100%" className={`${c.icon} h-full w-auto shrink-0`} aria-hidden />
        </div>
      </div>
    </div>
  );
}

// ================== PÁGINA ==================
export default function MotorizadoHomePage() {
  const { token } = useAuth();

  const [activo, setActivo] = useState<boolean | null>(null);
  const [switchBusy, setSwitchBusy] = useState(false);
  const [toggleErr, setToggleErr] = useState('');

  const [kpis, setKpis] = useState<KPIs>({
    asignadosHoy: 0,
    completados: 0,
    pendientes: 0,
    reprogramados: 0,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const estadoText = useMemo(() => {
    if (activo === null) return 'Cargando…';
    if (switchBusy) return 'Actualizando…';
    return activo ? 'Activo' : 'Inactivo';
  }, [activo, switchBusy]);

  const showCTA = useMemo(
    () => Boolean(activo && (kpis.asignadosHoy > 0 || kpis.pendientes > 0)),
    [activo, kpis.asignadosHoy, kpis.pendientes]
  );

  const ctaTitle = useMemo(() => {
    if (kpis.pendientes > 0) return '¡Tienes entregas pendientes hoy!';
    if (kpis.asignadosHoy > 0) return '¡Se te asignaron pedidos!';
    return '';
  }, [kpis.pendientes, kpis.asignadosHoy]);

  const ctaSubtitle = useMemo(() => {
    if (kpis.pendientes > 0)
      return `Tienes ${kpis.pendientes} entregas pendientes hoy. Ingresa al módulo de pedidos para más detalles y acciones.`;
    if (kpis.asignadosHoy > 0) return 'Dirígete a tus entregas para ver más detalle.';
    return '';
  }, [kpis.pendientes, kpis.asignadosHoy]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      setLoading(true);
      setErr('');

      const [dispRes, kpiRes] = await Promise.allSettled([
        getDisponibilidadRepartidor({ token, signal }),
        fetchKpisMotorizado(token, signal),
      ]);

      if (dispRes.status === 'fulfilled') {
        setActivo(dispRes.value.activo);
      } else if (!isAbort(dispRes.reason)) {
        setErr(dispRes.reason?.message ?? 'No se pudo obtener la disponibilidad');
      }

      if (kpiRes.status === 'fulfilled') {
        const kk = kpiRes.value as Partial<KPIs>;
        setKpis({
          asignadosHoy: kk.asignadosHoy ?? 0,
          completados: kk.completados ?? 0,
          pendientes: kk.pendientes ?? 0,
          reprogramados: kk.reprogramados ?? 0,
        });
      } else if (!isAbort(kpiRes.reason)) {
        setErr((prev) => prev || kpiRes.reason?.message || 'No se pudieron cargar los KPIs');
      }

      setLoading(false);
    },
    [token]
  );

  useEffect(() => {
    const ac = new AbortController();
    if (token) load(ac.signal);
    return () => ac.abort();
  }, [token, load]);

  // Toggle con UX de carga y duración mínima
  const onToggle = async () => {
    if (!token || switchBusy || activo === null) return;

    const next = !activo;
    setToggleErr('');
    setSwitchBusy(true);

    const start = Date.now();
    const MIN_SPIN_MS = 450;

    try {
      const r = await setDisponibilidadRepartidor({ token }, next);
      setActivo(r.activo);
    } catch (e: any) {
      if (!isAbort(e)) setToggleErr(e?.message || 'No se pudo actualizar la disponibilidad');
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_SPIN_MS) await new Promise((res) => setTimeout(res, MIN_SPIN_MS - elapsed));
      setSwitchBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header SIN fondo ni borde, con switch ABAJO a la derecha */}
      <header className="bg-transparent">
        <div className="mx-auto max-w-7xl px-6 pt-5 pb-2">
          {/* Grid 2x2: título arriba izq, subtítulo abajo izq, switch abajo der */}
          <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] items-end gap-x-4 gap-y-1">
            <Tittlex
              title="Panel de Control"
              description="Active o desactive su estado para realizar pedidos"
            />

            {/* Switch abajo-derecha */}
            <div className="col-start-2 self-end">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[14px] font-medium ${switchBusy ? 'text-sky-700' : activo ? 'text-emerald-600' : 'text-gray-600'
                    }`}
                  aria-live="polite"
                >
                  {estadoText}
                </span>

                <button
                  type="button"
                  onClick={onToggle}
                  disabled={switchBusy || activo === null}
                  aria-pressed={!!activo}
                  aria-busy={switchBusy}
                  className={[
                    'relative inline-flex h-6 w-12 items-center rounded-full transition-colors',
                    activo ? 'bg-green-500' : 'bg-gray-300',
                    switchBusy ? 'cursor-wait animate-pulse' : '',
                    switchBusy || activo === null ? 'opacity-90' : '',
                  ].join(' ')}
                >
                  <span className="sr-only">Cambiar disponibilidad</span>
                  <span
                    className={[
                      'inline-flex h-5 w-5 items-center justify-center transform rounded-full bg-white transition-transform',
                      activo ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  >
                    {switchBusy ? (
                      <Icon icon="line-md:loading-twotone-loop" width="14" height="14" className="animate-spin text-gray-500" />
                    ) : null}
                  </span>
                </button>
              </div>
              {toggleErr && (
                <p className="mt-1 text-xs text-red-600" role="status" aria-live="polite">
                  {toggleErr}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Pedidos Asignados Hoy" value={kpis.asignadosHoy} icon="lsicon:order-done-outline" accent="blue" disabled={!activo} />
          <KpiCard title="Entregas completadas" value={kpis.completados} icon="lsicon:order-abnormal-outline" accent="green" disabled={!activo} />
          <KpiCard title="Entregas Pendientes" value={kpis.pendientes} icon="lsicon:order-edit-outline" accent="amber" disabled={!activo} />
          <KpiCard title="Pedidos Reprogramados" value={kpis.reprogramados} icon="streamline-freehand:connect-device-exchange" accent="red" disabled={!activo} />
        </div>

        {/* Mensaje / CTA */}
        <section className="mt-14 text-center">
          {loading ? (
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          ) : activo ? (
            showCTA ? (
              <div className="mx-auto max-w-2xl rounded-xl border border-blue-200 bg-blue-50 p-5 text-left">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:bell-alert-outline" width="22" height="22" className="shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-blue-800">{ctaTitle}</h3>
                    <p className="mt-1 text-[13px] text-blue-900/80">{ctaSubtitle}</p>
                    <div className="mt-4">
                      <Link
                        to={GESTION_PEDIDOS_PATH}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        Ir a mis pedidos
                        <Icon icon="mdi:arrow-right" width="18" height="18" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Icon icon="mdi:check-circle-outline" width="24" height="24" />
                <p className="mt-6 text-sm">No tienes pedidos pendientes por ahora.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Icon icon="healthicons:negative-outline-24px" width="24" height="24" />
              <p className="mt-6 text-sm">
                Actualmente estás inactivo. Activa tu estado para recibir pedidos asignados por tu courier.
              </p>
            </div>
          )}
          {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
        </section>
      </main>
    </div>
  );
}
