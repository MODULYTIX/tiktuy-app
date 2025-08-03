import type { Almacenamiento } from '../almacenamiento/almacenamiento.types';
import type { Categoria } from '../categoria/categoria.types';

export interface Producto {
  id: number;
  uuid: string;
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion?: string;
  categoria_id: number;
  almacenamiento_id: number;
  precio: number;
  stock: number;
  stock_minimo: number;
  peso: number;
  estado: string;
  fecha_registro: string;
  created_at: string;
  updated_at: string;

  categoria: Categoria;
  almacenamiento: Almacenamiento;
}
