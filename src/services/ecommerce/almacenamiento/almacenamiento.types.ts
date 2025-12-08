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
  fecha_registro: string;

  representante_usuario_id?: number | null;

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
    /** NUEVO: algunos selects del backend ya devuelven teléfono */
    telefono?: string | null;
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
  items?: Array<{ producto_id: number; cantidad_validada: number }>;
  observaciones?: string;
}

export interface MovimientoAlmacen {
  id: number;
  uuid: string;
  descripcion: string;
  fecha_movimiento: string;

  observaciones?: string | null;
  evidencia_url?: string | null;

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
    cantidad_validada?: number | null;

    producto: {
      id: number;
      nombre_producto: string;
      stock: number;
      codigo_identificacion: string;
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
    /** NUEVO: mantener paridad con select del backend */
    telefono?: string | null;
  };
}

/**
 * Para el caso en que el backend una tus sedes + sedes de courier asociado.
 * Aquí "entidad" es OBLIGATORIA para saber el origen (ecommerce|courier)
 * sin romper los otros endpoints que la tienen opcional.
 */
export interface SedeConRepresentanteConEntidad
  extends Omit<SedeConRepresentante, 'entidad'> {
  entidad: {
    tipo: 'ecommerce' | 'courier';
    id: number;
    nombre_comercial: string;
  };
}

/** Respuesta típica del listado combinado */
export type SedesConRepresentanteResponse = SedeConRepresentanteConEntidad[];
