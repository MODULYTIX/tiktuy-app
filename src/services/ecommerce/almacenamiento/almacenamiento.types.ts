// src/services/ecommerce/almacenamiento/almacenamiento.types.ts

/* =========================
 * Core models (Frontend)
 * ========================= */

export interface Almacenamiento {
  id: number;
  uuid: string;
  nombre_almacen: string;

  departamento?: string | null;
  provincia?: string | null;
  ciudad: string;
  direccion: string;

  es_principal?: boolean;
  representante_usuario_id?: number | null;

  fecha_registro: string;

  estado?: {
    id: number;
    nombre: string;
  };

  ecommerce_id?: number | null;
  courier_id?: number | null;

  // Opcional: si el backend incluye el representante
  representante?: {
    id: number;
    uuid: string;
    nombres: string;
    apellidos: string;
    correo: string;
  } | null;

  /**
   * Opcional: info de la entidad dueña para ciertos listados
   * (el servicio puede adjuntarlo sin romper otros endpoints)
   */
  entidad?: {
    tipo: 'ecommerce' | 'courier';
    id: number;
    nombre_comercial: string;
  };
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

/** NUEVO: body para validar movimiento */
export interface MovimientoValidarBody {
  items?: Array<{
    producto_id: number;
    cantidad_validada: number;
  }>;
  /** Coincide con lo declarado en Swagger del endpoint */
  observaciones?: string;
}

export interface MovimientoAlmacen {
  id: number;
  uuid: string;
  descripcion: string;
  /** ISO string */
  fecha_movimiento: string;

  /** Opcional: si el backend persiste observaciones al validar */
  observaciones?: string | null;

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
    /** cantidad solicitada en la creación del movimiento */
    cantidad: number;

    /** Opcional: si el backend guarda la cantidad validada por ítem */
    cantidad_validada?: number | null;

    producto: {
      id: number;
      nombre_producto: string;
      stock: number;
    };
  }[];
}

/* =========================
 * Sedes / Invitaciones
 * ========================= */

export interface CrearSedeSecundariaDTO {
  nombre_sede: string;
  departamento?: string | null;
  provincia?: string | null;
  ciudad: string;
  direccion: string;
  representante: {
    nombres: string;
    apellidos: string;
    dni: string;
    celular?: string | null;
    correo: string;
  };
}

export interface CrearSedeSecundariaResponse {
  sede: Almacenamiento;
  invitacion: {
    token: string;
    expiracion: string; // ISO
    correo: string;
  };
}

export interface AceptarInvitacionDTO {
  token: string;
  password: string;
  passwordConfirm: string;
}

export interface AceptarInvitacionResponse {
  message: string;
  usuario: {
    id: number;
    uuid: string;
    nombres: string;
    apellidos: string;
    correo: string;
  };
}

export interface ReenviarInvitacionDTO {
  sedeId: number;
  correo?: string;
  representante?: {
    nombres: string;
    apellidos: string;
    dni: string;
    celular?: string | null;
  };
}

export interface ReenviarInvitacionResponse {
  sedeId: number;
  invitacion: {
    token: string;
    expiracion: string; // ISO
    correo: string;
  };
}

/* =========================
 * Entidades con almacenes
 * ========================= */

export interface EntidadConAlmacenes {
  id: number;
  nombre_comercial: string;
  _count: { almacenes: number };
}

export interface EntidadesConAlmacenResponse {
  ecommerces: EntidadConAlmacenes[];
  couriers: EntidadConAlmacenes[];
}

/* =========================
 * NUEVO: Sedes con representante
 * ========================= */

/**
 * Para el endpoint GET /almacenamiento/con-representante
 * Garantiza que "representante" viene presente (no null).
 */
export interface SedeConRepresentante
  extends Omit<Almacenamiento, 'representante'> {
  representante: {
    id: number;
    uuid: string;
    nombres: string;
    apellidos: string;
    correo: string;
  };
}
