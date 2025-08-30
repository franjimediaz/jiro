"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import TablaListado, { Columna } from "../../../components/TablaListado";

type MaterialAsignado = {
  id: number;
  material: { nombre: string };
  cantidad: number;
  precioUnidad: number;
  total: number;
  facturable: boolean;
};

const campos = [
  {
    nombre: "servicioId",
    etiqueta: "Servicio",
    tipo: "selectorTabla",
    tabla: "servicios",
    campoLabel: "nombre",
    campoValue: "id",
    multiple: false,
    readOnly: true,
  },
  {
    nombre: "obraId",
    etiqueta: "Obra",
    tipo: "selectorTabla",
    tabla: "obras",
    campoLabel: "nombre",
    campoValue: "id",
    multiple: false,
    readOnly: true,
  },
  {
    nombre: "clienteId",
    etiqueta: "Cliente",
    tipo: "selectorTabla",
    tabla: "clientes",
    campoLabel: "nombre",
    campoValue: "id",
    multiple: false,
    readOnly: true,
  },
  { nombre: "nombre", etiqueta: "Nombre de la Tarea" },
  { nombre: "descripcion", etiqueta: "Descripción" },
  { nombre: "fechaInicio", etiqueta: "Fecha de inicio", tipo: "date" },
  { nombre: "fechaFin", etiqueta: "Fecha de fin", tipo: "date" },
  {
    nombre: "estadoId",
    etiqueta: "Estado",
    tipo: "selectorTabla",
    tabla: "estados",
    campoLabel: "nombre",
    campoValue: "id",
  },
  { nombre: "progreso", etiqueta: "Progreso", tipo: "slider" },
  { nombre: "precioManoObra", etiqueta: "Mano de Obra" },
  { nombre: "cantidadMateriales", etiqueta: "Cantidad" },
  {
    nombre: "precioMateriales",
    etiqueta: "Precio materiales",
    tipo: "readonly",
  },
  { nombre: "total", etiqueta: "Total", tipo: "readonly" },
];

export default function NuevaTarea() {
  const router = useRouter();
  const { id: tareaIdUrl } = useParams();
  const esEdicion = Boolean(tareaIdUrl);

  const [valores, setValores] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    estadoId: "",
    progreso: "",
    fechaInicio: "",
    fechaFin: "",
    tareaId: "",
    servicioId: "",
    obraId: "",
    clienteId: "",
    precioManoObra: "",
    cantidadMateriales: "",
    precioMateriales: "",
    total: "",
  });

  const [materiales, setMateriales] = useState<MaterialAsignado[]>([]);
  const [servicioTareaId, setServicioTareaId] = useState<number | null>(null);

  const columnas: Columna[] = [
    { clave: "material.nombre", encabezado: "Material", tipo: "texto" },
    { clave: "cantidad", encabezado: "Cantidad", tipo: "texto" },
    { clave: "precioUnidad", encabezado: "€/Ud", tipo: "texto" },
    { clave: "total", encabezado: "Total €", tipo: "texto" },
    { clave: "facturable", encabezado: "Facturable", tipo: "checkbox" },
  ];

  const irAMateriales = () => {
    if (servicioTareaId) {
      router.push(`/materiales/STMaterial?servicioTareaId=${servicioTareaId}`);
    }
  };

  // Calcular total cada vez que cambian los valores
  useEffect(() => {
    const manoObra = parseFloat(valores.precioManoObra as string) || 0;
    const cantidad = parseFloat(valores.cantidadMateriales as string) || 0;
    const precioMaterial = parseFloat(valores.precioMateriales as string) || 0;
    const total = manoObra * cantidad + precioMaterial;
    setValores((prev) => ({ ...prev, total: total.toFixed(2) }));
  }, [
    valores.precioManoObra,
    valores.cantidadMateriales,
    valores.precioMateriales,
  ]);

  // Precarga de tarea y servicio_tarea
  useEffect(() => {
    if (!tareaIdUrl) return;

    const cargarDatos = async () => {
      try {
        const tareaRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tareas/${tareaIdUrl}`
        );
        const tarea = await tareaRes.json();

        const stRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/por-tarea/${tareaIdUrl}`
        );
        const servicioTarea = await stRes.json();
        setServicioTareaId(servicioTarea.id);

        setValores((prev) => ({
          ...prev,
          id: tarea.id || "",
          nombre: tarea.nombre || "",
          descripcion: tarea.descripcion || "",
          estadoId: tarea.estadoId || "",
          progreso: tarea.progreso || "",
          fechaInicio: servicioTarea.fechaInicio?.substring(0, 10) || "",
          fechaFin: servicioTarea.fechaFin?.substring(0, 10) || "",
          servicioId: servicioTarea.servicioId || "",
          obraId: servicioTarea.obraId || "",
          clienteId: servicioTarea.obra?.clienteId || "",
          precioManoObra: servicioTarea.precioManoObra?.toString() || "",
          cantidadMateriales:
            servicioTarea.cantidadMateriales?.toString() || "",
          precioMateriales: servicioTarea.precioMateriales?.toString() || "",
          total: servicioTarea.total?.toFixed(2) || "0.00",
        }));
      } catch (err) {
        console.error("❌ Error precargando datos:", err);
      }
    };

    cargarDatos();
  }, [tareaIdUrl]);

  // Precarga materiales asociados al servicio_tarea
  useEffect(() => {
    if (!servicioTareaId) return;

    const cargarMateriales = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/st_material/por-servicio/${servicioTareaId}`
        );
        const data = await res.json();
        setMateriales(data);
      } catch (err) {
        console.error("❌ Error cargando materiales:", err);
      }
    };

    cargarMateriales();
  }, [servicioTareaId]);

  // Actualiza precioMateriales al cambiar los materiales
  useEffect(() => {
    const materialesFacturables = materiales.filter((m) => m.facturable);
    const totalMateriales = materialesFacturables.reduce(
      (acc, m) => acc + (m.total || 0),
      0
    );
    setValores((prev) => ({
      ...prev,
      precioMateriales: totalMateriales.toFixed(2),
    }));
  }, [materiales]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      if (!esEdicion) return;

      // 1. Actualizar tarea
      const resUpdateTarea = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tareas/${valores.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            estadoId: Number(valores.estadoId),
            progreso: Number(valores.progreso),
          }),
        }
      );

      if (!resUpdateTarea.ok) throw new Error("Error actualizando tarea");

      // 2. Actualizar servicio_tarea
      const bodyUpdateST = {
        tareaId: Number(valores.id),
        obraId: Number(valores.obraId),
        servicioId: Number(valores.servicioId),
        fechaInicio: valores.fechaInicio,
        fechaFin: valores.fechaFin,
        estado: Number(valores.estadoId),
        precioManoObra: parseFloat(valores.precioManoObra) || 0,
        cantidadMateriales: parseFloat(valores.cantidadMateriales) || 0,
        precioMateriales: parseFloat(valores.precioMateriales) || 0,
        total: parseFloat(valores.total) || 0,
      };

      const resUpdateST = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyUpdateST),
        }
      );

      if (!resUpdateST.ok)
        throw new Error("Error actualizando servicios_tarea");

      alert("Tarea actualizada correctamente");
      router.push("/obras");
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      alert("Hubo un error al guardar. Revisa consola.");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este material?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/st_material/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Error al eliminar");
      setMateriales((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar material:", err);
    }
  };

  return (
    <div className="contenedor-formulario">
      <FormularioTabla
        titulo="Editar Tarea"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={handleSubmit}
        botonTexto="Actualizar Tarea"
      />
      <div className="alineado-boton">
        <button onClick={irAMateriales} className="boton-flotante">
          Asignar Material
        </button>
      </div>
      <TablaListado
        titulo=""
        columnas={columnas}
        datos={materiales}
        onVer={(m) => router.push(`/materiales/STMaterial/${m.id}`)}
        onEditar={(m) =>
          router.push(`/materiales/STMaterial/${m.id}?edit=true`)
        }
        onEliminar={(m) => handleEliminar(m.id)}
        mostrarImportar={false}
      />
      <div
        style={{ marginTop: "10px", textAlign: "right", fontWeight: "bold" }}
      >
        Total materiales facturables: {valores.precioMateriales} €
      </div>
    </div>
  );
}
