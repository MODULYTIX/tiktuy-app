// src/pages/motorizado/MotorizadoHomePage.tsx
import { useAuth } from '@/auth/context/useAuth';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// Ajusta al path real de tu módulo de Gestión de Pedidos
const GESTION_PEDIDOS_PATH = '/motorizado/pedidos';

function KpiCard({
  title,
  value,
  ring,
}: {
  title: string;
  value: number;
  ring: string; // ring-blue-200 | ring-green-200 | ring-amber-200 | ring-red-200
}) {
  const v = value.toString().padStart(2, '0');
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ring-1 ${ring}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{v}</p>
    </div>
  );
}

const isAbort = (e: unknown) =>
  (e as any)?.name === 'AbortError' || /aborted/i.test((e as any)?.message || '');

export default function MotorizadoHomePage() {
  const { user, token } = useAuth();

  // disponibilidad: null = aún cargando (evita parpadeo a "Inactivo")
  const [activo, setActivo] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  // KPIs
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

  // Mostrar CTA si está activo y hay pedidos asignados hoy O pendientes (programados)
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
    if (kpis.asignadosHoy > 0)
      return 'Dirígete a tus entregas para ver más detalle.';
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

      // Disponibilidad: única fuente para setActivo
      if (dispRes.status === 'fulfilled') {
        setActivo(dispRes.value.activo);
      } else if (!isAbort(dispRes.reason)) {
        setErr(dispRes.reason?.message ?? 'No se pudo obtener la disponibilidad');
      }

      // KPIs: no afectan 'activo'
      if (kpiRes.status === 'fulfilled') {
        const kk = kpiRes.value;
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
      setActivo(r.activo); // confirmación desde backend
    } catch (e: any) {
      setActivo((p) => (p === null ? null : !p)); // rollback
      if (!isAbort(e)) setErr(e?.message ?? 'No se pudo actualizar la disponibilidad');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Panel de Control</h1>
            <p className="text-sm text-gray-500">
              Activa o desactiva tu estado para realizar pedidos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${
                activo ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
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
        {/* saludo */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-primaryDark">Bienvenido Motorizado</h2>
          <p className="text-gray-700">Sesión iniciada como: {user?.correo}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Pedidos Asignados Hoy" value={kpis.asignadosHoy} ring="ring-blue-200" />
          <KpiCard title="Entregas completadas" value={kpis.completados} ring="ring-green-200" />
          <KpiCard title="Entregas Pendientes" value={kpis.pendientes} ring="ring-amber-200" />
          <KpiCard title="Pedidos Reprogramados" value={kpis.reprogramados} ring="ring-red-200" />
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
              <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
                Aún no tienes entregas asignadas. Te avisaremos apenas llegue una.
              </div>
            )
          ) : (
            <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
              Actualmente estás inactivo. Activa tu estado para recibir pedidos asignados por tu
              courier.
            </div>
          )}
          {err && !/aborted/i.test(err) && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </section>

        <footer className="px-1 pt-6 text-xs text-gray-400">Versión 1.0</footer>
      </main>
    </div>
  );
}
