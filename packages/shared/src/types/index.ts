export interface Material {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  proveedor: string;
  stockActual?: string;
  unidadMedida?: string;
}

export interface MaterialFormData {
  nombre: string;
  descripcion: string;
  precio: string;
  proveedor: string;
  stockActual: string;
  unidadMedida: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  tipo?: "text" | "number" | "select";
  opciones?: SelectOption[];
}
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
  precioManoObra: number;
  total: number;
  cantidad: number;
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
  dni?: string;
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
export interface Columna {
  clave: string;
  encabezado: string;
  tipo?: "texto" | "checkbox";
  render?: (valor: any, fila: any) => React.ReactNode;
}

export const UNIDADES_MEDIDA = [
  { value: "kg", label: "Kilogramos" },
  { value: "m2", label: "Metros Cuadrados" },
  { value: "m3", label: "Metros Cúbicos" },
  { value: "litros", label: "Litros" },
  { value: "unidad", label: "Unidades" },
  { value: "metro", label: "Metros" },
] as const;
