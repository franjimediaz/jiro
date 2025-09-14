"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import { RequirePermiso, usePermisos } from "../../../lib/permisos";

const secciones = [
  {
    titulo: "Identificación",
    descripcion: "Identificación y Datos Personales",
    expandible: true,
    expandidaPorDefecto: true,
    campos: [
      { nombre: "id", etiqueta: "ID", readonly: true, tipo: "readonly" },
      {
        nombre: "tipo",
        etiqueta: "Tipo",
        tipo: "selectorTabla",
        tabla: "tipos",
        campoLabel: "nombre",
        campoValue: "id",
      },
      { nombre: "estado", etiqueta: "Activo", tipo: "checkbox" },
      { nombre: "nombre", etiqueta: "Nombre" },
      { nombre: "apellidos", etiqueta: "Apellidos" },
      { nombre: "displayName", etiqueta: "Display Name" },
      { nombre: "dni", etiqueta: "DNI" },
      { nombre: "fotoUrl", etiqueta: "Foto URL" },
    ],
  },
  {
    titulo: "Contacto",
    descripcion: "Localización Empleado",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "email", etiqueta: "Email", tipo: "email" },
      { nombre: "emailPersonal", etiqueta: "Email Personal", tipo: "email" },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
      { nombre: "telefono2", etiqueta: "Teléfono 2", tipo: "tel" },
      { nombre: "calendarEmail", etiqueta: "Calendar Email" },
    ],
  },
  {
    titulo: "Puesto y Organización",
    descripcion: "Qué hace y con quién trabaja",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "puesto", etiqueta: "Puesto" },
      {
        nombre: "departamentoId",
        etiqueta: "Departamento",
        tipo: "selectorTabla",
        tabla: "departamentos",
        campoLabel: "nombre",
        campoValue: "id",
      },
      {
        nombre: "supervisorId",
        etiqueta: "Supervisor",
        tipo: "selectorTabla",
        tabla: "directorios",
        campoLabel: "nombre",
        campoValue: "id",
      },
      {
        nombre: "subordinados",
        etiqueta: "Subordinados",
        tipo: "selectorTabla",
        tabla: "directorios",
        campoLabel: "nombre",
        campoValue: "id",
        multiple: true,
      },
      { nombre: "rol", etiqueta: "Rol" },
      { nombre: "jornada", etiqueta: "Jornada" },
      { nombre: "turno", etiqueta: "Turno" },
      {
        nombre: "usuarioId",
        etiqueta: "Usuario",
        tipo: "selectorTabla",
        tabla: "usuarios",
        campoLabel: "nombre",
        campoValue: "id",
      },
    ],
  },
  {
    titulo: "Empresa y Relaciones Externas",
    descripcion: "Si pertenece a terceros o colaboraciones",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      {
        nombre: "empresaExternaId",
        etiqueta: "Empresa Externa",
        tipo: "selectorTabla",
        tabla: "empresasExternas",
        campoLabel: "nombre",
        campoValue: "id",
      },
    ],
  },
  {
    titulo: "Costes y Facturación",
    descripcion: "Parte económica del recurso",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "costeHora", etiqueta: "Coste Hora" },
      { nombre: "tarifaFacturacionHora", etiqueta: "Tarifa Facturación Hora" },
      { nombre: "moneda", etiqueta: "Moneda" },
      { nombre: "capacidadSemanalHoras", etiqueta: "Capacidad Semanal Horas" },
    ],
  },
  {
    titulo: "PRL y Seguros",
    descripcion: "Cumplimiento y seguridad",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "tienePRL", etiqueta: "Tiene PRL", tipo: "checkbox" },
      { nombre: "prlVencimiento", etiqueta: "PRL Vencimiento", tipo: "date" },
      { nombre: "rcVigente", etiqueta: "RC Vigente", tipo: "checkbox" },
      { nombre: "rcVencimiento", etiqueta: "RC Vencimiento", tipo: "date" },
    ],
  },
  {
    titulo: "Ubicación",
    descripcion: "Dónde trabaja o reside",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "ubicacionCiudad", etiqueta: "Ubicación Ciudad" },
      { nombre: "ubicacionProvincia", etiqueta: "Ubicación Provincia" },
      { nombre: "ubicacionPais", etiqueta: "Ubicación País" },
    ],
  },
  {
    titulo: "Histórico y Gestión",
    descripcion: "Vida laboral en la empresa",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "fechaAlta", etiqueta: "Fecha Alta", tipo: "date" },
      { nombre: "fechaBaja", etiqueta: "Fecha Baja", tipo: "date" },
      { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" },
      { nombre: "tags", etiqueta: "Tags", tipo: "tags" },
    ],
  },
];

export default function VerEditarDirectorio() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { can } = usePermisos();

  const modoEdicion = searchParams.get("edit") === "true";
  const puedeEditar = can("directorios", "editar");

  const [valores, setValores] = useState<any>({
    id: "",
    tipo: "",
    estado: true,
    nombre: "",
    apellidos: "",
    displayName: "",
    dni: "",
    fotoUrl: "",
    email: "",
    emailPersonal: "",
    telefono: "",
    telefono2: "",
    calendarEmail: "",
    puesto: "",
    departamentoId: "",
    supervisorId: "",
    subordinados: [],
    rol: "",
    jornada: "",
    turno: "",
    usuarioId: "",
    empresaExternaId: "",
    costeHora: "",
    tarifaFacturacionHora: "",
    moneda: "EUR",
    capacidadSemanalHoras: "",
    tienePRL: false,
    prlVencimiento: "",
    rcVigente: false,
    rcVencimiento: "",
    ubicacionCiudad: "",
    ubicacionProvincia: "",
    ubicacionPais: "",
    fechaAlta: "",
    fechaBaja: "",
    observaciones: "",
    tags: [],
  });

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/directorios/${id}`,
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
        // Normalización ligera de tipos
        setValores({
          ...data,
          estado: Boolean(data.estado),
          tienePRL: Boolean(data.tienePRL),
          rcVigente: Boolean(data.rcVigente),
          tags: Array.isArray(data.tags) ? data.tags : [],
          subordinados: Array.isArray(data.subordinados)
            ? data.subordinados
            : [],
          moneda: data.moneda || "EUR",
        });
      } catch (err) {
        console.error("Error al obtener Directorio:", err);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id, router]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    if (!puedeEditar) {
      alert("No tienes permisos para editar directorios.");
      router.replace("/403");
      return;
    }

    const payload = {
      ...valores,
      estado: Boolean(valores.estado),
      tienePRL: Boolean(valores.tienePRL),
      rcVigente: Boolean(valores.rcVigente),
      capacidadSemanalHoras: valores.capacidadSemanalHoras
        ? Number(valores.capacidadSemanalHoras)
        : null,
      costeHora: valores.costeHora ? Number(valores.costeHora) : null,
      tarifaFacturacionHora: valores.tarifaFacturacionHora
        ? Number(valores.tarifaFacturacionHora)
        : null,
      tags: Array.isArray(valores.tags)
        ? valores.tags
        : typeof valores.tags === "string" && valores.tags.trim()
          ? valores.tags.split(",").map((t: string) => t.trim())
          : [],
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/directorios/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

      if (res.ok) {
        alert("Directorio actualizado");
        router.push("/usuarios/directorios");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(
          "Error al actualizar: " +
            (data?.error || data?.message || "desconocido")
        );
      }
    } catch (err) {
      console.error("Error al actualizar Directorio:", err);
      alert("No se pudo actualizar el directorio. Revisa la consola.");
    }
  };

  if (cargando) return <p>Cargando Directorio...</p>;

  return (
    <RequirePermiso modulo="directorios" accion="ver" fallback={null}>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Directorio" : "Detalle del Directorio"}
        secciones={secciones}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
    </RequirePermiso>
  );
}
