"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";

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
      { nombre: "estado", etiqueta: "Estado" },
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

export default function VerEditarUsuario() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    idUsuario: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    rol: "",
    activo: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
        console.log(data);
      })
      .catch((err) => {
        console.error("Error al obtener Usuario:", err);

        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/Usuarios/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      }
    );

    if (res.ok) {
      alert("Usuario actualizado");
      router.push("/Usuarios");
    } else {
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Usuario...</p>;

  return (
    <>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Usuario" : "Detalle del Usuario"}
        secciones={secciones}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
    </>
  );
}
