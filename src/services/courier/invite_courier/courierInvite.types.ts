// src/services/courierInvite/courierInvite.types.ts
export interface CourierWhatsappLink {
  id: number;               // id de EcommerceCourier
  ecommerce_id: number;
  courier_id: number;
  link_whatsapp: string | null;
}

export interface UpdateWhatsappLinkBody {
  otherId: number;
  link: string;
}

export interface RequestWhatsappLinkBody {
  otherId: number;
}
