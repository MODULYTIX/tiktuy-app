// pedidos.types.ts

export interface ProductoInfo {
  id: number;
  nombre_producto: string;
  stock: number;
}

export interface PedidoDetalle {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  producto: ProductoInfo;
  descripcion?: string | null;
  marca?: string | null;
}

export interface UsuarioSimple {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface Empresa {
  id: number;
  nombre_comercial: string;
}

export interface MotorizadoInfo {
  id: number;
  usuario: UsuarioSimple;
}

// Estados que usamos en la app
export type EstadoPedido = 'Asignado' | 'Pendiente' | 'Entregado' | 'Generado'; // Generado solo legacy

export interface Pedido {
  id: number;
  codigo_pedido: string;
  estado_pedido: EstadoPedido; // <─ antes era string a secas

  nombre_cliente: string;
  numero_cliente: string;
  celular_cliente: string;
  direccion_envio: string;
  referencia_direccion?: string;
  distrito: string;
  monto_recaudar: number;
  zona_tarifaria_id?: number;

  fecha_entrega_programada: string | null;
  fecha_creacion: string;

  sede_id: number;

  ecommerce: Empresa;
  courier?: Empresa;   // sigue opcional (puede venir null desde el backend)
  motorizado?: MotorizadoInfo;

  detalles: PedidoDetalle[];
}

/* =========================================================
 * DTO para CREAR pedido desde el ecommerce
 * (sin courier_id, usando sede_id)
 * ======================================================= */
export interface CrearPedidoDTO {
  codigo_pedido: string;
  sede_id: number; // el backend obtiene el courier a partir de esta sede

  nombre_cliente: string;
  numero_cliente: string;
  celular_cliente: string;
  direccion_envio: string;
  referencia_direccion?: string;
  distrito: string;
  monto_recaudar: number;
  zona_tarifaria_id?: number;
  fecha_entrega_programada?: string | null;

  detalles: {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}
export interface ProductoSede {
  id: number;
  nombre_producto: string;
  precio: number;
  stock: number;
  descripcion?: string | null;
  codigo_identificacion?: string | null;
  imagen_url?: string | null;
}

export interface ZonaTarifariaSede {
  id: number;
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: number;
  pago_motorizado: number;
  sede_id: number;
}
