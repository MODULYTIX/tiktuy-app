// Relación completa ecommerce-courier (usado para /ecommerce-courier)
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

// Input para crear nueva relación ecommerce-courier
export type NuevaRelacionInput = {
  courier_id: number;
};

// Couriers asociados con estado (usado para select o filtro)
// Couriers asociados con estado (usado para select o filtro)
export interface CourierAsociado {
  id: number;
  nombre_comercial: string;
  telefono: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  nombre_usuario: string;
  estado_asociacion: string; // o: 'Activo' | 'No Asociado'
  id_relacion: number | null; // ← permitir null
}

