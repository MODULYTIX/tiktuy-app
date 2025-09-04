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

type KPIs = {
  asignadosHoy: number;
  completados: number;
  pendientes: number;
  reprogramados: number;
};

const GESTION_PEDIDOS_PATH = '/motorizado/pedidos';

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
  const display = disabled ? '--' : value.toString().padStart(2, '0');

  const c = {
    blue: {
      ring: 'ring-blue-200',
      icon: 'text-blue-600',
      bar: 'from-blue-500 to-blue-400',
    },
    green: {
      ring: 'ring-green-200',
      icon: 'text-green-600',
      bar: 'from-green-500 to-green-400',
    },
    amber: {
      ring: 'ring-amber-200',
      icon: 'text-amber-600',
      bar: 'from-amber-500 to-amber-400',
    },
    red: {
      ring: 'ring-red-200',
      icon: 'text-red-600',
      bar: 'from-red-500 to-red-400',
    },
  }[accent];

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm ring-1 ${c.ring}`}>
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r ${c.bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[14px] font-medium text-gray-700">{title}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-gray-800">{display}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center">
          <Icon icon={icon} width="36" height="36" className={c.icon} />
        </div>
      </div>
    </div>
  );
}

// ---- helper para detectar aborts (USADO) ----
const isAbort = (e: unknown) =>
  (e as any)?.name === 'AbortError' || /aborted/i.test((e as any)?.message || '');

export default function MotorizadoHomePage() {
  const {  token } = useAuth();

  const [activo, setActivo] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

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
    return activo ? 'Activo' : 'Inactivo';
  }, [activo]);

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

      // Disponibilidad
      if (dispRes.status === 'fulfilled') {
        setActivo(dispRes.value.activo);
      } else if (!isAbort(dispRes.reason)) {
        setErr(dispRes.reason?.message ?? 'No se pudo obtener la disponibilidad');
      }

      // KPIs
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

  const onToggle = async () => {
    if (!token || toggling || activo === null) return;
    const next = !activo;
    try {
      setToggling(true);
      setErr('');
      setActivo(next); // optimista
      const r = await setDisponibilidadRepartidor({ token }, next);
      setActivo(r.activo); // confirma backend
    } catch (e) {
      // rollback si falla y no es abort
      if (!isAbort(e)) {
        setActivo((p) => (p === null ? null : !p));
        setErr((e as any)?.message ?? 'No se pudo actualizar la disponibilidad');
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-center text-center flex-col px-4 py-3">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E3A8A]">Panel de Control</h1>
            <p className="text-lg text-gray-600">Active o desactive su estado para realizar pedidos</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-medium ${activo ? 'text-emerald-600' : 'text-gray-600'}`}>
              {estadoText}
            </span>
            <button
              type="button"
              onClick={onToggle}
              disabled={toggling || activo === null}
              aria-pressed={!!activo}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                activo ? 'bg-emerald-500' : 'bg-gray-300'
              } ${toggling || activo === null ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="sr-only">Cambiar disponibilidad</span>
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  activo ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Pedidos Asignados Hoy"
            value={kpis.asignadosHoy}
            icon="mdi:note-edit"
            accent="blue"
            disabled={!activo}
          />
          <KpiCard
            title="Entregas completadas"
            value={kpis.completados}
            icon="mdi:clipboard-check"
            accent="green"
            disabled={!activo}
          />
          <KpiCard
            title="Entregas Pendientes"
            value={kpis.pendientes}
            icon="mdi:clipboard-alert"
            accent="amber"
            disabled={!activo}
          />
          <KpiCard
            title="Pedidos Reprogramados"
            value={kpis.reprogramados}
            icon="mdi:calendar-refresh"
            accent="red"
            disabled={!activo}
          />
        </div>

        {/* Mensaje / CTA */}
        <section className="mt-8">
          {loading ? (
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          ) : activo ? (
            showCTA ? (
              <div className="rounded-2xl border bg-white p-6">
                <p className="text-lg font-semibold text-gray-800">{ctaTitle}</p>
                <p className="mt-1 text-gray-600">{ctaSubtitle}</p>
                <div className="mt-4">
                  <Link
                    to={GESTION_PEDIDOS_PATH}
                    className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800"
                  >
                    Ir a ver pedidos <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center text-gray-600">
                <Icon icon="mdi:bell-outline" width="36" height="36" className="text-gray-400" />
                <p className="mt-4 max-w-[48ch] text-sm leading-6">
                  Aún no tienes entregas asignadas. Te avisaremos apenas llegue una.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center">
              <Icon icon="mdi:minus" width="36" height="36" className="text-gray-400" />
              <p className="mt-6 max-w-[48ch] text-sm leading-6 text-gray-600">
                Actualmente estás inactivo. Activa tu estado para recibir pedidos asignados por tu courier.
              </p>
            </div>
          )}
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </section>

        <footer className="px-1 pt-6 text-xs text-gray-400">Versión 1.0</footer>
      </main>
    </div>
  );
}
