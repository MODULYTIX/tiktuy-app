export interface PerfilTrabajador {
  id: number
  fecha_creacion: string
  nombres: string
  apellidos: string
  DNI_CI: string
  correo: string
  perfil: string
  telefono: string
  rol_perfil: string
  modulo_asignado: string[]
}

export interface RegistrarTrabajadorPayload {
  nombres: string
  apellidos: string
  DNI_CI: string
  telefono: string
  correo: string
  contrasena: string
  rol_perfil_id: number
  modulos: string[]
}

export interface EditarTrabajadorPayload {
  nombres: string
  apellidos: string
  telefono: string
  correo: string
  rol_perfil_id: number
  modulos: string[]
}
