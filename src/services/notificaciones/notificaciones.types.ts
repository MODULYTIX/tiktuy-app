// src/services/notificaciones/notificaciones.types.ts
export type NotiTipo = 'PEDIDO' | 'SISTEMA' | 'INVITACION' | 'ALERTA';
export type NotiCanal = 'APP' | 'WHATSAPP' | 'EMAIL';

export interface Notificacion {
  id: number;
  usuario_id?: number | null;
  trabajador_id?: number | null;
  tipo: NotiTipo;
  canal: NotiCanal;
  titulo: string;
  mensaje: string;
  data?: any;
  leido: boolean;
  created_at: string; // ISO
}

export interface ListNotisResponse {
  items: Notificacion[];
  total: number;
  unreadTotal: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}
