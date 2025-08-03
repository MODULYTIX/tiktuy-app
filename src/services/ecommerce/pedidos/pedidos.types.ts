export interface PedidoDetalle {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  producto: {
    id: number;
    nombre_producto: string;
    stock: number;
  };
}

export interface Pedido {
  id: number;
  codigo_pedido: string;
  estado_pedido: string;
  nombre_cliente: string;
  numero_cliente: string;
  celular_cliente: string;
  direccion_envio: string;
  referencia_direccion?: string;
  distrito: string;
  monto_recaudar: number;
  fecha_entrega_programada: string;
  fecha_creacion: string;

  ecommerce: {
    id: number;
    nombre_comercial: string;
  };

  courier: {
    id: number;
    nombre_comercial: string;
  };

  motorizado?: {
    id: number;
    usuario: {
      id: number;
      nombres: string;
      apellidos: string;
    };
  };

  detalles: PedidoDetalle[];
}
