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
export default function VerEditarDirectorio() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const { can } = usePermisos();

  // Si intentan editar sin permiso, redirigimos a 403
  useEffect(() => {
    if (modoEdicion && !can("directorios", "editar")) {
      router.replace("/403");
    }
  }, [modoEdicion, can, router]);

  const [valores, setValores] = useState<any>({
    id: "",
    tipo: "",
    estado: false,
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
          {
            credentials: "include",
          }
        );

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }

        const data = await res.json();
        // Asegurar defaults razonables por si el backend omite alguna clave
        setValores((prev: any) => ({
          ...prev,
          ...data,
          estado: Boolean(data?.estado),
          tienePRL: Boolean(data?.tienePRL),
          rcVigente: Boolean(data?.rcVigente),
          tags: Array.isArray(data?.tags) ? data.tags : [],
          subordinados: Array.isArray(data?.subordinados)
            ? data.subordinados
            : [],
          fechaAlta: data?.fechaAlta ? data.fechaAlta.substring(0, 10) : "",
          fechaBaja: data?.fechaBaja ? data.fechaBaja.substring(0, 10) : "",
          prlVencimiento: data?.prlVencimiento
            ? data.prlVencimiento.substring(0, 10)
            : "",
          rcVencimiento: data?.rcVencimiento
            ? data.rcVencimiento.substring(0, 10)
            : "",
        }));
      } catch (err) {
        console.error("Error al obtener Directorio:", err);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };
  const toNullableString = (v: any): string | null => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const toIntOrNull = (v: any): number | null => {
    const s = toNullableString(v);
    if (s === null) return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : Math.trunc(n);
  };
  const toDecimalStringOrNull = (v: any): string | null => {
    const s = toNullableString(v);
    if (s === null) return null;
    const norm = s.replace(",", ".");
    return /^-?\d+(\.\d+)?$/.test(norm) ? norm : null; // Prisma Decimal acepta string
  };

  const handleSubmit = async () => {
    // 1) Validaciones rápidas de UI
    if (!valores.nombre?.trim() || !valores.email?.trim()) {
      alert("Faltan campos obligatorios: Nombre y Email");
      return;
    }
    // Evita supervisor circular
    if (valores.supervisorId && valores.supervisorId === id) {
      alert("Un directorio no puede ser su propio supervisor");
      return;
    }

    // 2) Normalizaciones (coinciden con lo que espera tu backend PUT)
    const payload: Record<string, any> = {
      // Strings ("" → null; undefined = no tocar)
      ...(valores.tipo !== undefined && {
        tipo: toNullableString(valores.tipo),
      }),
      ...(valores.nombre !== undefined && { nombre: valores.nombre }),
      ...(valores.apellidos !== undefined && { apellidos: valores.apellidos }),
      ...(valores.displayName !== undefined && {
        displayName: toNullableString(valores.displayName),
      }),
      ...(valores.dni !== undefined && { dni: toNullableString(valores.dni) }),
      ...(valores.email !== undefined && { email: valores.email }),
      ...(valores.emailPersonal !== undefined && {
        emailPersonal: toNullableString(valores.emailPersonal),
      }),
      ...(valores.telefono !== undefined && {
        telefono: toNullableString(valores.telefono),
      }),
      ...(valores.telefono2 !== undefined && {
        telefono2: toNullableString(valores.telefono2),
      }),
      ...(valores.fotoUrl !== undefined && {
        fotoUrl: toNullableString(valores.fotoUrl),
      }),
      ...(valores.puesto !== undefined && {
        puesto: toNullableString(valores.puesto),
      }),
      ...(valores.rol !== undefined && { rol: toNullableString(valores.rol) }),
      ...(valores.jornada !== undefined && {
        jornada: toNullableString(valores.jornada),
      }),
      ...(valores.turno !== undefined && {
        turno: toNullableString(valores.turno),
      }),
      ...(valores.calendarEmail !== undefined && {
        calendarEmail: toNullableString(valores.calendarEmail),
      }),
      ...(valores.ubicacionCiudad !== undefined && {
        ubicacionCiudad: toNullableString(valores.ubicacionCiudad),
      }),
      ...(valores.ubicacionProvincia !== undefined && {
        ubicacionProvincia: toNullableString(valores.ubicacionProvincia),
      }),
      ...(valores.ubicacionPais !== undefined && {
        ubicacionPais: toNullableString(valores.ubicacionPais),
      }),
      ...(valores.observaciones !== undefined && {
        observaciones: toNullableString(valores.observaciones),
      }),

      // Booleans (si no llegan, no tocar el valor en BD)
      ...(valores.estado !== undefined && { estado: Boolean(valores.estado) }),
      ...(valores.tienePRL !== undefined && {
        tienePRL: Boolean(valores.tienePRL),
      }),
      ...(valores.rcVigente !== undefined && {
        rcVigente: Boolean(valores.rcVigente),
      }),

      // FKs STRING (cuid): "" → null
      ...(valores.departamentoId !== undefined && {
        departamentoId: toNullableString(valores.departamentoId),
      }),
      ...(valores.supervisorId !== undefined && {
        supervisorId: toNullableString(valores.supervisorId),
      }),
      ...(valores.empresaExternaId !== undefined && {
        empresaExternaId: toNullableString(valores.empresaExternaId),
      }),

      // FK INT: usuarioId (id de Usuario)
      ...(valores.usuarioId !== undefined && {
        usuarioId: toIntOrNull(valores.usuarioId),
      }),

      // Números
      ...(valores.capacidadSemanalHoras !== undefined && {
        capacidadSemanalHoras: toIntOrNull(valores.capacidadSemanalHoras),
      }),

      // Decimales → string (Decimal)
      ...(valores.costeHora !== undefined && {
        costeHora: toDecimalStringOrNull(valores.costeHora),
      }),
      ...(valores.tarifaFacturacionHora !== undefined && {
        tarifaFacturacionHora: toDecimalStringOrNull(
          valores.tarifaFacturacionHora
        ),
      }),

      // Moneda (respeta default si no mandas nada)
      ...(valores.moneda !== undefined && {
        moneda: toNullableString(valores.moneda),
      }),

      // Fechas (YYYY-MM-DD → Date en backend)
      ...(valores.prlVencimiento !== undefined && {
        prlVencimiento: toNullableString(valores.prlVencimiento),
      }),
      ...(valores.rcVencimiento !== undefined && {
        rcVencimiento: toNullableString(valores.rcVencimiento),
      }),
      ...(valores.fechaBaja !== undefined && {
        fechaBaja: toNullableString(valores.fechaBaja),
      }),

      // Arrays
      ...(valores.tags !== undefined && {
        tags: Array.isArray(valores.tags) ? valores.tags : [],
      }),
    };

    // Nunca enviar campos que el backend no espera en PUT:
    delete payload.id;
    delete payload.fechaAlta; // readonly en PUT
    delete payload.subordinados; // se gestionan por supervisorId

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/directorios/${id}`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Directorio actualizado");
        router.push("/usuarios/directorios");
      } else {
        let detalle = "";
        try {
          const j = await res.json();
          detalle = j?.error || JSON.stringify(j);
        } catch {}
        alert("Error al actualizar" + (detalle ? `: ${detalle}` : ""));
      }
    } catch (e: any) {
      console.error("Error en actualización:", e?.message || e);
      alert("Error inesperado al actualizar");
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
