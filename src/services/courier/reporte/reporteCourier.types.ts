
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
