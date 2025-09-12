export interface Modulo {
  id: string;
  nombre: string;
  ruta: string;
  icono: string;
  descripcion: string;
  acciones?: string[];
}

export interface PermisosModulo {
  [accion: string]: boolean;
}

export interface PermisosRol {
  [moduloId: string]: PermisosModulo;
}

export interface ValoresFormularioRol {
  nombre: string;
  descripcion: string;
  nivel: number;
  activo: boolean;
  permisos: PermisosRol;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  nivel: number;
  activo: boolean;
  permisos: string; // JSON stringified
  createdAt: Date;
  updatedAt: Date;
}
