// Tipos para exportación de PEDIDOS

export type ExportPedidosFilters = {
    from?: string;        // 'yyyy-mm-dd'
    to?: string;          // 'yyyy-mm-dd'
    courierId?: number;
    estadoId?: number;
  };
  
  export type DownloadResult = {
    filename: string;
    blob: Blob;
  };
  