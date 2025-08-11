export interface Almacenamiento {
  id: number;
  uuid: string;
  nombre_almacen: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  fecha_registro: string;
  estado: {
    id: number;
    nombre: string;
  };
  ecommerce_id?: number;
  courier_id?: number;
}

export interface MovimientoPayload {
  almacen_origen_id: number;
  almacen_destino_id: number;
  descripcion: string;
  productos: {
    producto_id: number;
    cantidad: number;
  }[];
}

export interface MovimientoAlmacen {
  id: number;
  uuid: string;
  descripcion: string;
  fecha_movimiento: string; 
  estado: {
    id: number;
    nombre: string;
  };
  almacen_origen: {
    id: number;
    nombre_almacen: string;
  };
  almacen_destino: {
    id: number;
    nombre_almacen: string;
  };
  productos: {
    id: number;
    cantidad: number;
    producto: {
      id: number;
      nombre: string;
      stock: number;
    };
  }[];
}
