export interface EcommerceCourier {
  id: number;
  uuid: string;
  ecommerce_id: number;
  courier_id: number;
  fecha_asociacion: string;
  estado: 'Asociado' | 'No Asociado';
  ecommerce: {
    id: number;
    uuid: string;
    usuario_id: number;
    nombre_comercial: string;
    ruc: string;
    ciudad: string;
    direccion: string;
    rubro: string;
    estado: string;
    created_at: string;
    updated_at: string;
  };
  courier: {
    id: number;
    uuid: string;
    usuario_id: number;
    nombre_comercial: string;
    ruc: string;
    representante: string;
    departamento: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    estado: string;
    created_at: string;
    updated_at: string;
  };
}

export type NuevaRelacionInput = {
  courier_id: number;
};

export interface CourierAsociado {
  id: number; // Este es el courier_id
  id_relacion: number | null; // ID de la relación si existe
  departamento: string;
  ciudad: string;
  direccion: string;
  nombre_comercial: string;
  telefono: string;
  estado_asociacion: 'activo' | 'inactivo' | 'No Asociado';
}
