"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso } from "../../../lib/permisos";

const secciones = [
  {
    titulo: "Identificación",
    descripcion: "Identificación y Datos Personales",
    expandible: true,
    expandidaPorDefecto: true,
    campos: [
      {
        nombre: "id",
        etiqueta: "ID",
        readonly: true,
        tipo: "readonly",
      },
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

export default function NuevoDirectorio() {
  const router = useRouter();

  const [valores, setValores] = useState<any>({
    id: "",
    tipo: "",
    estado: true,
    nombre: "",
    apellidos: "",
    displayName: "",
    dni: "",
    email: "",
    emailPersonal: "",
    telefono: "",
    telefono2: "",
    fotoUrl: "",
    puesto: "",
    departamentoId: "",
    supervisorId: "",
    subordinados: [],
    rol: "",
    jornada: "",
    turno: "",
    empresaExternaId: "",
    usuarioId: "",
    calendarEmail: "",
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

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const usuarioIdParsed =
      valores.usuarioId === "" || valores.usuarioId == null
        ? null
        : Number(valores.usuarioId);

    if (usuarioIdParsed !== null && Number.isNaN(usuarioIdParsed)) {
      alert("El campo 'Usuario' es inválido.");
      return;
    }

    // Validación rápida de obligatorios
    if (
      !valores.nombre?.trim() ||
      !valores.apellidos?.trim() ||
      !valores.email?.trim()
    ) {
      alert("Faltan campos obligatorios: Nombre, Apellidos y Email");
      return;
    }
    // Validación básica de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) {
      alert("Email no válido");
      return;
    }
    if (
      valores.calendarEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.calendarEmail)
    ) {
      alert("Calendar Email no válido");
      return;
    }

    const payload = {
      ...valores,
      // Scalars
      estado: Boolean(valores.estado),
      tienePRL: Boolean(valores.tienePRL),
      rcVigente: Boolean(valores.rcVigente),

      // Ints
      capacidadSemanalHoras: valores.capacidadSemanalHoras
        ? Number(valores.capacidadSemanalHoras)
        : null,

      // Decimals → string (mejor para Prisma Decimal)
      costeHora:
        valores.costeHora !== "" && valores.costeHora != null
          ? String(valores.costeHora)
          : null,
      tarifaFacturacionHora:
        valores.tarifaFacturacionHora !== "" &&
        valores.tarifaFacturacionHora != null
          ? String(valores.tarifaFacturacionHora)
          : null,

      // FK Int
      usuarioId: usuarioIdParsed,

      // Arrays
      tags: Array.isArray(valores.tags) ? valores.tags : [],
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/directorios`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        alert("Directorio creado correctamente");
        router.push("/usuarios/directorios");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(
          "Error al crear el directorio" + (err?.error ? `: ${err.error}` : "")
        );
      }
    } catch (e) {
      console.error("Error al crear directorio:", e);
      alert("Error inesperado al crear el directorio");
    }
  };

  return (
    <RequirePermiso modulo="directorios" accion="crear" fallback={null}>
      <FormularioTabla
        titulo="Crear Directorio"
        secciones={secciones}
        valores={valores}
        onChange={handleChange}
        onSubmit={handleSubmit}
        botonTexto="Crear"
      />
    </RequirePermiso>
  );
}
