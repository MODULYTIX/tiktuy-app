export type MovimientoItem = {
    producto_id?: number;
    producto_uuid?: string;
    codigo_identificacion?: string;
    nombre_producto?: string;
    descripcion?: string;
    cantidad?: number;
    stock_previo?: number;
    stock_posterior?: number;
  };
  
  export type AlmacenRef = {
    id?: number | string;
    nombre_almacen?: string;
  };
  
  export type EstadoRef = {
    id?: number | string;
    nombre?: string;
  };
  
  export type MovimientoResumen = {
    id: number;
    uuid: string;
    descripcion?: string;
    fecha_movimiento: string;
    estado: EstadoRef;
    almacen_origen: AlmacenRef | null;
    almacen_destino: AlmacenRef | null;
  };
  
  export type MovimientoDetalle = {
    id?: number | string;
    codigo?: string;
    fecha?: string; // ISO
    descripcion?: string;
    almacen_origen?: AlmacenRef | null;
    almacen_destino?: AlmacenRef | null;
    estado?: EstadoRef | string | null;
    items?: MovimientoItem[];
    meta?: {
      fecha_generacion?: string | null;
      fecha_validacion?: string | null;
    };
  };
  