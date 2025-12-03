  // src/services/courier/zona_tarifaria/zona_tarifaria.types.ts

  /** ----------- Tipos genéricos de API ----------- **/
  export interface ApiSuccess<T> {
    ok: true;
    data: T;
  }
  export interface ApiError {
    ok: false;
    error: string;
    status?: number;
  }
  export type ApiResult<T> = ApiSuccess<T> | ApiError;

  /** ----------- Utilidades ----------- **/
  /**
   * Prisma Decimal suele llegar como string en JSON (dependiendo de la config).
   * Para el front, permitimos number | string y luego casteamos donde toque.
   */
  export type DecimalJSON = number | string;

  /** ----------- Entidades / DTOs ----------- **/

  export interface EstadoMin {
    id: number;
    nombre: string;
    tipo?: string | null;
  }

  export interface ZonaTarifaria {
    id: number;
    uuid?: string;
    courier_id: number;
    // En el schema es Int? (puede venir null si hay registros antiguos sin sede)
    sede_id?: number | null;
    distrito: string;
    zona_tarifario: string;
    tarifa_cliente: DecimalJSON;
    pago_motorizado: DecimalJSON;
    estado_id: number;
    fecha_registro?: string;
    estado?: EstadoMin | null;
  }

  /**
   * Payload para crear zona (ruta "admin"):
   *   POST /zona-tarifaria
   * El backend espera sede_id explícito.
   */
  export interface CrearZonaTarifariaPayload {
    sede_id: number;
    distrito: string;
    zona_tarifario: string;
    tarifa_cliente: number;
    pago_motorizado: number;
    estado_id?: number; // opcional (backend hace fallback a "Activo/zona")
  }

  /**
   * Payload para crear zona para el usuario autenticado:
   *   POST /zona-tarifaria/mias
   *
   * ✅ IMPORTANTE:
   *  - NO incluye sede_id.
   *  - El backend resuelve courier + sede por defecto internamente.
   */
  export type CrearZonaTarifariaParaMiUsuarioPayload = {
    distrito: string;
    zona_tarifario: string;
    tarifa_cliente: number;
    pago_motorizado: number;
    estado_id?: number;
  };

  /** Payload para actualizar (backend permite campos opcionales; no incluye sede_id/courier_id) */
  export interface ActualizarZonaTarifariaPayload {
    distrito?: string;
    zona_tarifario?: string;
    tarifa_cliente?: number;
    pago_motorizado?: number;
    estado_id?: number;
  }

  /** Respuesta pública: solo distrito (select: { distrito: true }) */
  export interface ZonaTarifariaPublic {
    distrito: string;
  }

  /**
   * Respuesta pública extendida cuando se usa onlyDistritos=false:
   * { distrito, zona_tarifario, tarifa_cliente, pago_motorizado }
   */
  export interface ZonaTarifariaPublicFull {
    distrito: string;
    zona_tarifario: string;
    tarifa_cliente: DecimalJSON;
    pago_motorizado: DecimalJSON;
  }
