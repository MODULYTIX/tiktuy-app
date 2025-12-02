// src/services/courier-movimientos/courier-movimientos.types.ts

export interface CourierMovimientoItem {
  id: number;
  uuid: string;
  descripcion: string; // si en tu DB puede ser null, cámbialo a: string | null
  fecha_movimiento: string;
  estado: { id: number; nombre: string }; // 'Proceso' | 'Observado' | 'Validado'
  almacen_origen: { id: number; nombre_almacen: string };
  almacen_destino: { id: number; nombre_almacen: string };
}

export interface CourierMovimientosResponse {
  page: number;
  limit: number;
  total: number;
  items: CourierMovimientoItem[];
}

export interface CourierMovimientoProductoDet {
  id: number;           // id del MovimientoProducto
  cantidad: number;
  producto: {
    id: number;
    codigo_identificacion: string;
    nombre_producto: string;
    descripcion: string | null;
    stock: number;
  };
}

export interface CourierMovimientoDetalle {
  id: number;
  uuid: string;
  descripcion: string | null;
  fecha_movimiento: string;
  estado: { id: number; nombre: string }; // 'Proceso' | 'Observado' | 'Validado'
  almacen_origen: { id: number; nombre_almacen: string } | null;
  almacen_destino: { id: number; nombre_almacen: string } | null;
  productos: CourierMovimientoProductoDet[];
}
