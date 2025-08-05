// Datos para crear un nuevo trabajador + su perfil asignado
export interface CrearPerfilTrabajadorDTO {
    nombre: string;
    apellido: string;
    correo: string;
    telefono?: string;
    DNI_CI: string;
    password: string;
    perfil_id: number;
    modulo_asignado: string; 
  }
  
  // Datos para actualizar un perfil de trabajador existente
  export interface ActualizarPerfilTrabajadorDTO {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    perfil_id?: number;
    estado_id?: number;
    modulo_asignado?: string; 
  }
  
  // Respuesta al consultar un perfil de trabajador (GET /perfil-trabajador)
  export interface PerfilTrabajadorResponse {
    id: number;
    usuario_id: number;
    ecommerce_id?: number | null;
    courier_id?: number | null;
    perfil_id: number;
    codigo_trabajador: string;
    estado_id: number;
    fecha_creacion: string;
    modulo_asignado: string; 
    usuario: {
      id: number;
      nombre: string;
      apellido: string;
      correo: string;
      telefono?: string;
      DNI_CI: string;
      rol_id: number;
    };
    perfil: {
      id: number;
      nombre: string;
      descripcion: string;
      modulos: string; 
    };
  }
  
  // Perfiles disponibles para asignar a un trabajador
  export interface PerfilDisponible {
    id: number;
    nombre: string;
    descripcion: string;
    modulos: string;
  }
  