export interface Categoria {
  id: number;
  uuid: string;
  nombre: string;
  descripcion?: string | null; 
  es_global?: boolean;         
  created_at?: string;
  updated_at?: string;
}
