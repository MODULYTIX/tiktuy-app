// src/services/courierInvite/courierInvite.types.ts

export interface CourierWhatsappLink {
  id: number;                 // id de EcommerceSede (o tu tabla de asociación)
  ecommerce_id: number;
  courier_id: number;
  sede_id: number;            // ✅ nuevo
  link_whatsapp: string | null;
}

export interface GetWhatsappLinkQuery {
  otherId: number;
  sedeId: number;             // ✅ nuevo
}

export interface UpdateWhatsappLinkBody {
  otherId: number;
  sedeId: number;             // ✅ nuevo
  link: string;
}

export interface RequestWhatsappLinkBody {
  otherId: number;
  sedeId: number;             // ✅ nuevo
}
