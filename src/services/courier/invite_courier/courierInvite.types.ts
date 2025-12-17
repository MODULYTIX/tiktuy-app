// src/services/courierInvite/courierInvite.types.ts

export interface CourierWhatsappLink {
  id: number;                 // id de EcommerceSede (o tu tabla de asociación)
  ecommerce_id: number;
  courier_id: number;
  sede_id: number;
  link_whatsapp: string | null;
}

export interface GetWhatsappLinkQuery {
  otherId: number;
  sedeId: number;
}

export interface UpdateWhatsappLinkBody {
  otherId: number;
  sedeId: number;
  link: string;
}

export interface RequestWhatsappLinkBody {
  otherId: number;
  sedeId: number;
}
