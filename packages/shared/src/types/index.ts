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
export const UNIDADES_MEDIDA = [
  { value: "kg", label: "Kilogramos" },
  { value: "m2", label: "Metros Cuadrados" },
  { value: "m3", label: "Metros Cúbicos" },
  { value: "litros", label: "Litros" },
  { value: "unidad", label: "Unidades" },
  { value: "metro", label: "Metros" },
] as const;
