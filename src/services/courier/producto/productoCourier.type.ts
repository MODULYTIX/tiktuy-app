export type Estado = {
    id: number;
    nombre: string;
    tipo: string | null;
  };
  
  export type Almacenamiento = {
    id: number;
    uuid: string;
    nombre_almacen: string;
    ciudad: string;
    departamento: string;
    direccion: string;
    ecommerce_id: number | null;
    courier_id: number | null;
    estado_id: number;
  };
  
  export type Categoria = {
    id: number;
    uuid: string;
    descripcion: string;
    ecommerce_id: number;
    estado_id: number;
    nombre: string;
  };
  
  export type Producto = {
    id: number;
    uuid: string;
    codigo_identificacion: string;
    nombre_producto: string;
    descripcion: string | null;
    categoria_id: number;
    almacenamiento_id: number;
    precio: string;        // Prisma Decimal llega como string en JSON
    stock: number;
    stock_minimo: number;
    peso: string;          // Prisma Decimal -> string
    estado_id: number;
    fecha_registro: string;
    created_at: string;
    updated_at: string;
    categoria?: Categoria;
    almacenamiento?: Almacenamiento;
    estado?: Estado;
  };
  
  // Payload para crear
  export type CreateCourierProductoInput = {
    codigo_identificacion?: string;
    nombre_producto: string;
    descripcion?: string | null;
    categoria_id: number;
    almacenamiento_id: number;
    precio?: number;       // opcional (el backend pone 0 si falta)
    stock?: number;        // opcional
    stock_minimo?: number; // opcional
    peso?: number;         // opcional
  };