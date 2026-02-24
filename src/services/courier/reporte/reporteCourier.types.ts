
/* =========================================================
   TIPOS – COURIER
========================================================= */

import type { VistaReporte } from "@/services/ecommerce/reportes/ecommerceReportes.types";

export type CourierEntregaDonutItem = {
    label: string;
    value: number;
};

export type CourierMotorizadoItem = {
    motorizadoId: number;
    motorizado: string;
};

export type CourierEntregasReporteResp = {
    filtros: {
        vista: VistaReporte;
        desde?: string;
        hasta?: string;
    };
    kpis: {
        totalPedidos: number;
        entregados: number;
        tasaEntrega: number;
    };
    donut: CourierEntregaDonutItem[];
    motorizados: CourierMotorizadoItem[];
    historial?: {
        label: string; // e.g. "Ene", "Feb" or "2024-01-01"
        [key: string]: any; // dynamic keys for states
    }[];
    evolucion?: {
        label: string;
        entregados: number;
        rechazados: number;
        noResponde: number;
        anulados: number;
    }[];
};

export type CourierIngresosReporteResp = {
    filtros: {
        vista: VistaReporte;
        desde?: string;
        hasta?: string;
    };
    kpis: {
        ingresosTotales: number;
        totalPedidos: number;
        ingresosRepartidor?: number;
    };
    tabla: {
        fecha: string;
        ingresos: number;
        totalPedidos: number;
    }[];
    grafico: {
        labels: string[];
        series: number[];
    };
};
