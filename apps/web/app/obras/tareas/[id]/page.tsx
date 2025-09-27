"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FormularioTabla, TablaListado } from "@repo/ui";
import { Columna } from "@repo/shared/types";
import { RequirePermiso } from "../../../lib/permisos";

type MaterialAsignado = {
  id: number;
  material: { nombre: string };
  cantidad: number;
  preciounidad?: number; // ← en DB es "preciounidad"
  total: number;
  facturable: boolean;
};

const campos = [
  {
    titulo: "Identificación",
    descripcion:
      "Datos básicos de la tarea y su vinculación con otros registros.",
    expandible: true,
    expandidaPorDefecto: true,
    campos: [
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
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea" },
    ],
  },
  {
    titulo: "Planificación",
    descripcion: "Fechas, estado y responsables de la tarea.",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
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
        multiple: true, // si tu backend no soporta array, ponlo en false
      },
      { nombre: "progreso", etiqueta: "Progreso", tipo: "slider" },
    ],
  },
  {
    titulo: "Costes",
    descripcion:
      "Cálculo de mano de obra, materiales y totales asociados a la tarea.",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
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
      { nombre: "precioManoObra", etiqueta: "Mano de Obra" },
      { nombre: "cantidadMateriales", etiqueta: "Cantidad" },
      {
        nombre: "precioMateriales",
        etiqueta: "Precio materiales",
        tipo: "readonly",
        readOnly: true,
      },
      { nombre: "total", etiqueta: "Total", tipo: "readonly", readOnly: true },
    ],
  },
];

export default function NuevaTarea() {
  const router = useRouter();
  const { id: tareaIdUrl } = useParams();
  const esEdicion = Boolean(tareaIdUrl);

  const [valores, setValores] = useState<any>({
    id: "",
    nombre: "",
    descripcion: "",
    direccion: "",
    estadoId: "",
    progreso: "",
    fechaInicio: "",
    fechaFin: "",
    tareaId: "",
    servicioId: "",
    obraId: "",
    usuarioId: "",
    clienteId: "",
    precioManoObra: "",
    cantidadMateriales: "",
    precioMateriales: "",
    total: "",
    costeResponsable: [],
  });

  const [materiales, setMateriales] = useState<MaterialAsignado[]>([]);
  const [servicioTareaId, setServicioTareaId] = useState<number | null>(null);

  const columnas: Columna[] = [
    { clave: "material.nombre", encabezado: "Material", tipo: "texto" },
    { clave: "cantidad", encabezado: "Cantidad", tipo: "texto" },
    { clave: "preciounidad", encabezado: "€/Ud", tipo: "texto" },
    { clave: "total", encabezado: "Total €", tipo: "texto" },
    { clave: "facturable", encabezado: "Facturable", tipo: "checkbox" },
  ];

  const irAMateriales = () => {
    if (servicioTareaId) {
      router.push(`/materiales/STMaterial?servicioTareaId=${servicioTareaId}`);
    }
  };

  const calcularCosteResponsable = (costeData: any[]) => {
    if (!Array.isArray(costeData)) return 0;

    return costeData.reduce((total: number, fila: any) => {
      const dias = parseFloat(fila.dias) || 0;
      const precioDia = parseFloat(fila.precioDia) || 0;
      const metros = parseFloat(fila.metro) || 0;
      const precioMetro = parseFloat(fila.precioMetro) || 0;
      const costeFila = dias * precioDia + metros * precioMetro;
      fila.total = costeFila.toFixed(2); // actualizar total de la fila
      return total + costeFila;
    }, 0);
  };

  // Calcular total (incluyendo costeResponsable)
  useEffect(() => {
    const manoObra = parseFloat(valores.precioManoObra as string) || 0;
    const cantidad = parseFloat(valores.cantidadMateriales as string) || 0;
    const precioMaterial = parseFloat(valores.precioMateriales as string) || 0;
    const costeResp = calcularCosteResponsable(valores.costeResponsable || []);

    const total = manoObra * cantidad + precioMaterial + costeResp;
    setValores((prev: any) => ({ ...prev, total: total.toFixed(2) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    valores.precioManoObra,
    valores.cantidadMateriales,
    valores.precioMateriales,
    valores.costeResponsable,
  ]);

  // Precarga de tarea y servicio_tarea
  useEffect(() => {
    if (!tareaIdUrl) return;

    const cargarDatos = async () => {
      try {
        // Tarea
        const tareaRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tareas/${tareaIdUrl}`,
          { credentials: "include" }
        );
        if (tareaRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (tareaRes.status === 403) {
          router.replace("/403");
          return;
        }
        const tarea = await tareaRes.json();

        // Servicio_Tarea por tarea
        const stRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/por-tarea/${tareaIdUrl}`,
          { credentials: "include" }
        );
        if (stRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (stRes.status === 403) {
          router.replace("/403");
          return;
        }
        const servicioTarea = await stRes.json();
        if (servicioTarea?.id) setServicioTareaId(servicioTarea.id);

        setValores((prev: any) => ({
          ...prev,
          id: tarea?.id ?? "",
          nombre: tarea?.nombre ?? "",
          descripcion: tarea?.descripcion ?? "",
          estadoId: tarea?.estadoId ?? "",
          progreso: tarea?.progreso ?? "",
          fechaInicio: servicioTarea?.fechaInicio?.substring(0, 10) || "",
          fechaFin: servicioTarea?.fechaFin?.substring(0, 10) || "",
          servicioId: servicioTarea?.servicioId ?? "",
          obraId: servicioTarea?.obraId ?? "",
          direccion: servicioTarea?.obra?.direccion || tarea?.direccion || "",
          clienteId: servicioTarea?.obra?.clienteId || "",
          precioManoObra: servicioTarea?.precioManoObra?.toString() || "",
          cantidadMateriales:
            servicioTarea?.cantidadMateriales?.toString() || "",
          precioMateriales: servicioTarea?.precioMateriales?.toString() || "",
          total:
            typeof servicioTarea?.total === "number"
              ? servicioTarea.total.toFixed(2)
              : "0.00",
          costeResponsable: Array.isArray(servicioTarea?.costeResponsable)
            ? servicioTarea.costeResponsable
            : [],
        }));
      } catch (err) {
        console.error("❌ Error precargando datos:", err);
      }
    };

    cargarDatos();
  }, [tareaIdUrl, router]);

  // Precarga materiales asociados al servicio_tarea
  useEffect(() => {
    if (!servicioTareaId) return;

    const cargarMateriales = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/st_material/por-servicio/${servicioTareaId}`,
          { credentials: "include" }
        );
        if (res.status === 401) {
          window.location.href = "/login";
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
    };

    cargarMateriales();
  }, [servicioTareaId, router]);

  // Actualiza precioMateriales al cambiar los materiales
  useEffect(() => {
    const materialesFacturables = (materiales || []).filter(
      (m) => m.facturable
    );
    const totalMateriales = materialesFacturables.reduce(
      (acc, m) => acc + (Number(m.total) || 0),
      0
    );
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
          return { ...fila, total: totalFila.toFixed(2) };
        }
      );
      setValores((prev: any) => ({ ...prev, [nombre]: costeActualizado }));
    } else {
      setValores((prev: any) => ({ ...prev, [nombre]: valor }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!esEdicion) return;

      // 1) Actualizar tarea
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
            direccion: valores.direccion,
          }),
        }
      );
      if (resUpdateTarea.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (resUpdateTarea.status === 403) {
        router.replace("/403");
        return;
      }
      if (!resUpdateTarea.ok) throw new Error("Error actualizando tarea");

      // 2) Actualizar servicio_tarea (sin 'estado', no existe en schema)
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
      };

      const resUpdateST = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyUpdateST),
          credentials: "include",
        }
      );
      if (resUpdateST.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (resUpdateST.status === 403) {
        router.replace("/403");
        return;
      }
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
          credentials: "include",
        }
      );
      if (res.status === 401) {
        window.location.href = "/login";
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

  return (
    <RequirePermiso modulo="tareas" accion="editar">
      <div className="contenedor-formulario">
        <FormularioTabla
          titulo="Editar Tarea"
          secciones={campos}
          valores={valores}
          onChange={handleChange}
          onSubmit={handleSubmit}
          botonTexto="Actualizar Tarea"
        />

        <div className="alineado-boton">
          <button
            onClick={irAMateriales}
            className="boton-flotante"
            disabled={!servicioTareaId}
            title={
              !servicioTareaId
                ? "Esta tarea aún no tiene vínculo de servicio. Guarda y vuelve a abrir."
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
    </RequirePermiso>
  );
}
