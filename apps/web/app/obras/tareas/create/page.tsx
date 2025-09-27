"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { FormularioTabla, TablaListado } from "@repo/ui";
import { Columna } from "@repo/shared/types";
import { RequirePermiso } from "../../../lib/permisos";

type MaterialAsignado = {
  id: number;
  material?: {
    nombre: string;
  };
  cantidad: number;
  preciounidad?: number; // 👈 el backend usa "preciounidad" (según tus columnas)
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
  { nombre: "direccion", etiqueta: "Dirección", readOnly: true },
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
  {
    nombre: "usuarioId",
    etiqueta: "Responsable",
    tipo: "selectorTabla",
    tabla: "usuarios",
    campoLabel: "nombre",
    campoValue: "id",
    multiple: true, // ⚠️ tu backend tiene usuarioId:number? Si no admite array, cámbialo a false
  },
  {
    nombre: "costeResponsable",
    etiqueta: "Coste Responsable",
    tipo: "subtabla",
    columnas: [
      { clave: "dias", label: "Días" },
      { clave: "precioDia", label: "Precio día" },
      { clave: "metro", label: "Metro" },
      { clave: "precioMetro", label: "Precio Metro" },
      { clave: "total", label: "Total", tipo: "readonly" },
    ],
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
  const searchParams = useSearchParams();
  const servicioTareaIdParam = searchParams.get("servicioTareaId");
  const obraIdParam = searchParams.get("obraId");
  const servicioIdParam = searchParams.get("servicioId");
  const esEdicion = Boolean(servicioTareaIdParam);
  const { id } = useParams(); // por si en el futuro lo usas

  const columnas: Columna[] = [
    { clave: "material.nombre", encabezado: "Material", tipo: "texto" },
    { clave: "cantidad", encabezado: "Cantidad", tipo: "texto" },
    { clave: "preciounidad", encabezado: "€/Ud", tipo: "texto" },
    { clave: "total", encabezado: "Total €", tipo: "texto" },
    { clave: "facturable", encabezado: "Facturable", tipo: "checkbox" },
  ];

  const [valores, setValores] = useState<any>({
    id: "",
    nombre: "",
    direccion: "",
    descripcion: "",
    estadoId: "",
    progreso: "",
    fechaInicio: "",
    tareaId: "",
    fechaFin: "",
    servicioId: servicioIdParam ? Number(servicioIdParam) : "",
    obraId: obraIdParam ? Number(obraIdParam) : "",
    clienteId: "",
    precioManoObra: "",
    cantidadMateriales: "",
    precioMateriales: "",
    total: "",
    costeResponsable: [],
  });

  const [materiales, setMateriales] = useState<MaterialAsignado[]>([]);

  const irAMateriales = () => {
    if (!servicioTareaIdParam) return;
    router.push(
      `/materiales/STMaterial?servicioTareaId=${servicioTareaIdParam}`
    );
  };

  const calcularCosteResponsable = (costeData: any[]) => {
    if (!Array.isArray(costeData)) return 0;

    return costeData.reduce((total: number, fila: any) => {
      const dias = parseFloat(fila.dias) || 0;
      const precioDia = parseFloat(fila.precioDia) || 0;
      const metros = parseFloat(fila.metro) || 0;
      const precioMetro = parseFloat(fila.precioMetro) || 0;
      return total + dias * precioDia + metros * precioMetro;
    }, 0);
  };

  // Recalcular totales cuando cambian inputs relevantes
  useEffect(() => {
    const manoObra = parseFloat(valores.precioManoObra as string) || 0;
    const cantidad = parseFloat(valores.cantidadMateriales as string) || 0;
    const precioMaterial = parseFloat(valores.precioMateriales as string) || 0;
    const costeResponsableTotal = calcularCosteResponsable(
      valores.costeResponsable
    );

    const total = manoObra * cantidad + precioMaterial + costeResponsableTotal;
    setValores((prev: any) => ({ ...prev, total: total.toFixed(2) }));
  }, [
    valores.precioManoObra,
    valores.cantidadMateriales,
    valores.precioMateriales,
    valores.costeResponsable,
  ]);

  // Cargar datos básicos de la obra para clienteId/dirección
  useEffect(() => {
    if (obraIdParam && !valores.clienteId) {
      (async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/obras/${obraIdParam}`,
            {
              credentials: "include",
            }
          );

          if (res.status === 401) {
            if (typeof window !== "undefined") window.location.href = "/login";
            return;
          }
          if (res.status === 403) {
            router.replace("/403");
            return;
          }

          const obra = await res.json();
          setValores((prev: any) => ({
            ...prev,
            obraId: Number(obraIdParam),
            servicioId: servicioIdParam ? Number(servicioIdParam) : "",
            clienteId: obra.clienteId || "",
            direccion: obra.direccion || "",
          }));
        } catch (error) {
          console.error("Error cargando obra para obtener clienteId:", error);
        }
      })();
    }
  }, [obraIdParam, servicioIdParam, valores.clienteId, router]);

  // Cargar servicio_tarea (y crear una tarea si no existe)
  useEffect(() => {
    if (!servicioTareaIdParam) return;

    const cargarTarea = async (): Promise<void> => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaIdParam}`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();

        if (!data.tarea) {
          // Crear nueva tarea vacía
          const nuevaTareaRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombre: "Nueva tarea",
                descripcion: "",
                estadoId: Number(valores.estadoId) || null,
              }),
            }
          );
          if (!nuevaTareaRes.ok) throw new Error("Error al crear nueva tarea");
          const nuevaTarea = await nuevaTareaRes.json();

          // Asociar la tarea al servicio_tarea
          const patchRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaIdParam}`,
            {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tareaId: nuevaTarea.id }),
            }
          );
          if (!patchRes.ok)
            throw new Error("Error al asociar tarea recién creada");

          // Recargar
          return cargarTarea();
        }

        setValores((prev: any) => ({
          ...prev,
          id: data.tarea.id ?? "",
          nombre: data.tarea.nombre ?? "",
          descripcion: data.tarea.descripcion ?? "",
          estadoId: data.tarea.estadoId ?? "", // 🔧 antes tomaba "estado"; ahora "estadoId"
          servicioId: data.servicioId ?? "",
          obraId: data.obraId ?? "",
          progreso: data.tarea.progreso ?? "", // 🔧 antes usaba data.progreso
          fechaInicio: data.fechaInicio?.substring(0, 10) || "",
          fechaFin: data.fechaFin?.substring(0, 10) || "",
          precioManoObra: data.precioManoObra?.toString() || "",
          cantidadMateriales: data.cantidadMateriales?.toString() || "",
          precioMateriales: data.precioMateriales?.toString() || "",
          total:
            typeof data.total === "number" ? data.total.toFixed(2) : "0.00",
          clienteId: data.obra?.clienteId || prev.clienteId || "",
          costeResponsable: Array.isArray(data.costeResponsable)
            ? data.costeResponsable
            : [],
          direccion: data.obra?.direccion || prev.direccion || "",
        }));
      } catch (err) {
        console.error("Error al cargar datos desde servicio_tarea:", err);
      }
    };

    cargarTarea();
  }, [servicioTareaIdParam, router, valores.estadoId]);

  // Cargar materiales asignados a este servicio_tarea
  useEffect(() => {
    if (!servicioTareaIdParam) return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/st_material/por-servicio/${servicioTareaIdParam}`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();
        setMateriales(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error cargando materiales:", err);
      }
    })();
  }, [servicioTareaIdParam, router]);

  // Sumar materiales facturables -> precioMateriales
  useEffect(() => {
    const totalMateriales = (materiales || [])
      .filter((m) => m?.facturable)
      .reduce((acc, m) => acc + (Number(m.total) || 0), 0);

    setValores((prev: any) => ({
      ...prev,
      precioMateriales: totalMateriales.toFixed(2),
    }));
  }, [materiales]);

  const handleChange = (nombre: string, valor: any) => {
    if (nombre === "costeResponsable") {
      const costeActualizado = (Array.isArray(valor) ? valor : []).map(
        (fila: any) => {
          const dias = parseFloat(fila.dias) || 0;
          const precioDia = parseFloat(fila.precioDia) || 0;
          const metros = parseFloat(fila.metro) || 0;
          const precioMetro = parseFloat(fila.precioMetro) || 0;
          const totalFila = dias * precioDia + metros * precioMetro;

          return {
            ...fila,
            total: totalFila.toFixed(2),
          };
        }
      );

      setValores((prev: any) => ({ ...prev, [nombre]: costeActualizado }));
    } else {
      setValores((prev: any) => ({ ...prev, [nombre]: valor }));
    }
  };

  const bodyUpdateST = {
    tareaId: Number(valores.id),
    obraId: Number(valores.obraId),
    servicioId: Number(valores.servicioId),
    fechaInicio: valores.fechaInicio || null,
    fechaFin: valores.fechaFin || null,
    precioManoObra: parseFloat(valores.precioManoObra) || 0,
    cantidadMateriales: parseFloat(valores.cantidadMateriales) || 0,
    precioMateriales: parseFloat(valores.precioMateriales) || 0,
    total: parseFloat(valores.total) || 0,
    costeResponsable: valores.costeResponsable,
    // ❌ no enviar "estado" aquí; Servicios_Tarea no lo tiene en tu esquema
  };

  const handleSubmit = async () => {
    try {
      let tareaId: number | null = null;

      if (esEdicion) {
        // 1) Actualizar Tarea
        const resUpdateTarea = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tareas/${valores.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: valores.nombre,
              descripcion: valores.descripcion,
              estadoId: Number(valores.estadoId) || null,
              progreso: Number(valores.progreso) || 0,
            }),
          }
        );

        if (resUpdateTarea.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (resUpdateTarea.status === 403) {
          router.replace("/403");
          return;
        }

        if (!resUpdateTarea.ok) throw new Error("Error actualizando tarea");
        const tareaActualizada = await resUpdateTarea.json();
        tareaId = tareaActualizada.id;

        // 2) Actualizar Servicios_Tarea
        const resUpdateST = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaIdParam}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyUpdateST),
          }
        );

        if (resUpdateST.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (resUpdateST.status === 403) {
          router.replace("/403");
          return;
        }

        if (!resUpdateST.ok)
          throw new Error("Error actualizando vinculación servicio-tarea");

        alert("Tarea actualizada correctamente");
      } else {
        // Crear Tarea
        const resTarea = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: valores.nombre,
              descripcion: valores.descripcion,
              estadoId: Number(valores.estadoId) || null,
              progreso: Number(valores.progreso) || 0,
            }),
          }
        );

        if (resTarea.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (resTarea.status === 403) {
          router.replace("/403");
          return;
        }

        if (!resTarea.ok) throw new Error("Error al crear tarea");
        const tareaCreada = await resTarea.json();
        tareaId = tareaCreada.id;

        // Vincular servicio con tarea
        const bodyCreateST = {
          tareaId: Number(tareaId),
          obraId: Number(valores.obraId),
          servicioId: Number(valores.servicioId),
          fechaInicio: valores.fechaInicio || null,
          fechaFin: valores.fechaFin || null,
          precioManoObra: parseFloat(valores.precioManoObra) || 0,
          cantidadMateriales: parseFloat(valores.cantidadMateriales) || 0,
          precioMateriales: parseFloat(valores.precioMateriales) || 0,
          total: parseFloat(valores.total) || 0,
          costeResponsable: valores.costeResponsable,
        };

        const resST = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyCreateST),
          }
        );

        if (resST.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (resST.status === 403) {
          router.replace("/403");
          return;
        }

        if (!resST.ok) throw new Error("Error al vincular servicio con tarea");
        alert("Tarea creada correctamente");
      }

      router.push(`/obras`);
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ Error al guardar la tarea:", error.message);
      } else {
        console.error("❌ Error desconocido al guardar la tarea:", error);
      }
      alert(
        "❌ Hubo un problema al guardar la tarea. Revisa la consola para más detalles."
      );
    }
  };

  const handleEliminar = async (id: number) => {
    const confirmar = confirm("¿Seguro que deseas eliminar este material?");
    if (!confirmar) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/st_material/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (!res.ok) throw new Error("Error al eliminar");
      setMateriales((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar material:", err);
    }
  };

  // Acción requerida: editar si es edición; crear si es alta
  const accionRequerida = esEdicion ? "editar" : "crear";

  return (
    <RequirePermiso modulo="tareas" accion={accionRequerida}>
      <div className="contenedor-formulario">
        <FormularioTabla
          titulo={esEdicion ? "Editar Tarea" : "Crear Tarea"}
          campos={campos}
          valores={valores}
          onChange={handleChange}
          onSubmit={handleSubmit}
          botonTexto={esEdicion ? "Actualizar Tarea" : "Crear Tarea"}
        />

        <div className="alineado-boton">
          <button
            onClick={irAMateriales}
            className="boton-flotante"
            disabled={!esEdicion} // hasta que exista el servicio_tarea
            title={
              !esEdicion
                ? "Primero guarda la tarea para poder asignar materiales."
                : ""
            }
          >
            Asignar Material
          </button>
        </div>

        <TablaListado
          titulo=""
          columnas={columnas}
          datos={materiales}
          onVer={(material) =>
            router.push(`/materiales/STMaterial/${material.id}`)
          }
          onEditar={(material) =>
            router.push(`/materiales/STMaterial/${material.id}?edit=true`)
          }
          onEliminar={(material) => handleEliminar(material.id)}
          mostrarImportar={false}
        />

        <div
          style={{ marginTop: "10px", textAlign: "right", fontWeight: "bold" }}
        >
          Total materiales facturables: {valores.precioMateriales} €
        </div>
      </div>
    </RequirePermiso>
  );
}
