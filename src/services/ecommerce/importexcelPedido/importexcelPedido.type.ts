// src/services/ecommerce/importExcel/importexcel.type.ts
export type PreviewItemDTO = {
    producto: string;
    cantidad: number | null;
    producto_id?: number; // si el usuario mapea a un producto existente
  };
  
  export type PreviewGroupDTO = {
    grupo: number;
    courier: string;
    nombre: string;
    telefono: string;
    distrito: string;
    direccion: string;
    referencia?: string;
    monto_total: number;
    fecha_entrega: string | null; // ISO
    valido: boolean;
    items: PreviewItemDTO[];
  };
  
  export type PreviewResponseDTO = {
    estado: 'ok' | 'parcial' | 'vacio';
    total: number;
    ok: number;
    preview: PreviewGroupDTO[];
  };
  
  export type ImportPayload = {
    groups: PreviewGroupDTO[];
    courierId: number;
    trabajadorId?: number;
    estadoId?: number;
  };
  