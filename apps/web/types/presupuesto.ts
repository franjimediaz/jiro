// /types/presupuesto.ts

export interface MaterialPresupuesto {
  nombre: string;
  cantidad: number;
  precioUnidad: number;
  facturable: boolean;
}

export interface TareaPresupuesto {
  nombre: string;
  descripcion: string;
  precioManoObra: number,
  total: number;
  cantidad :number;
  materiales: MaterialPresupuesto[];
}

export interface ServicioPresupuesto {
  servicioNombre: string;
  tareas: TareaPresupuesto[];
}

export interface EmpresaInfo {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  CIF?: string;
  logoUrl?: string;
  firma?: string;
}

export interface ClienteInfo {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export interface EmpresaBranding {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  logo?: string;
  CIF?: string;
  firma?: string;
}
export interface ArbolPresupuestoProps {
  presupuestoId: number;
}
