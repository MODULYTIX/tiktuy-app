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

export interface Pedido {
  id: number;
  codigo_pedido: string;
  estado_pedido: string; // p.ej. 'Generado' | 'Asignado' | 'Entregado'
  nombre_cliente: string;
  numero_cliente: string;
  celular_cliente: string;
  direccion_envio: string;
  referencia_direccion?: string;
  distrito: string;
  monto_recaudar: number;
  fecha_entrega_programada: string | null;
  fecha_creacion: string;

  ecommerce: Empresa;
  courier: Empresa;
  motorizado?: MotorizadoInfo;

  detalles: PedidoDetalle[];
}
