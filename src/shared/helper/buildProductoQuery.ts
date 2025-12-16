import type { ProductoListQuery } from "@/services/ecommerce/producto/producto.types";

type EstadoProducto = "activo" | "inactivo" | "descontinuado";

function normalizeEstado(
  value?: string
): EstadoProducto | undefined {
  if (value === "activo") return "activo";
  if (value === "inactivo") return "inactivo";
  if (value === "descontinuado") return "descontinuado";
  return undefined;
}

export function buildProductoQuery(
  filters: {
    almacenamiento_id?: string;
    categoria_id?: string;
    estado?: string;
    search?: string;
    stock_bajo?: boolean;
    precio_bajo?: boolean;
    precio_alto?: boolean;
  },
  page: number,
  perPage: number
): Partial<ProductoListQuery> {
  return {
    page,
    perPage,

    almacenamiento_id: filters.almacenamiento_id
      ? Number(filters.almacenamiento_id)
      : undefined,

    categoria_id: filters.categoria_id
      ? Number(filters.categoria_id)
      : undefined,

    estado: normalizeEstado(filters.estado),


    stock_bajo: filters.stock_bajo || undefined,
    precio_bajo: filters.precio_bajo || undefined,
    precio_alto: filters.precio_alto || undefined,
  };
}
