"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type BrandingValores = {
  id: string | number | "";
  nombre: string;
  CIF: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  web: string;
  logoUrl: string;
  colorGeneral: string;
  colorPDF: string;
  CondicionesPresupuesto: string;
  firma: string;
};

const campos = [
  { nombre: "nombre", etiqueta: "Nombre de la empresa" },
  { nombre: "CIF", etiqueta: "CIF" },
  { nombre: "direccion", etiqueta: "Dirección fiscal" },
  { nombre: "codigoPostal", etiqueta: "CP" },
  { nombre: "localidad", etiqueta: "Localidad" },
  { nombre: "provincia", etiqueta: "Provincia" },
  { nombre: "telefono", etiqueta: "Teléfono" },
  { nombre: "email", etiqueta: "Email" },
  { nombre: "web", etiqueta: "Web" },
  { nombre: "logoUrl", etiqueta: "Logo", tipo: "archivo", documento: true },
  { nombre: "colorGeneral", etiqueta: "Color General", tipo: "color" },
  { nombre: "colorPDF", etiqueta: "Color PDF", tipo: "color" },
  {
    nombre: "CondicionesPresupuesto",
    etiqueta: "Condiciones Presupuestos",
    tipo: "richtext",
  },
  { nombre: "firma", etiqueta: "Firma", tipo: "archivo", documento: true },
];

export default function BrandingPage() {
  const router = useRouter();
  const { can } = usePermisos();

  const [valores, setValores] = useState<BrandingValores>({
    id: "",
    nombre: "",
    CIF: "",
    direccion: "",
    codigoPostal: "",
    localidad: "",
    provincia: "",
    telefono: "",
    email: "",
    web: "",
    logoUrl: "",
    colorGeneral: "#000000",
    colorPDF: "#000000",
    CondicionesPresupuesto: "",
    firma: "",
  });

  const [brandingId, setBrandingId] = useState<number | null>(null);
  const puedeEditar = can("branding", "editar");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding`, {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();

        if (data?.id) {
          setBrandingId(data.id);
          setValores({
            id: data.id,
            nombre: data.nombre || "",
            CIF: data.CIF || "",
            direccion: data.direccion || "",
            codigoPostal: data.codigoPostal || "",
            localidad: data.localidad || "",
            provincia: data.provincia || "",
            telefono: data.telefono || "",
            email: data.email || "",
            web: data.web || "",
            logoUrl: data.logoUrl || "",
            colorGeneral: data.colorGeneral || "#000000",
            colorPDF: data.colorPDF || "#000000",
            CondicionesPresupuesto: data.CondicionesPresupuesto || "",
            firma: data.firma || "",
          });
        }
      } catch (err) {
        console.error("Error al cargar branding:", err);
      }
    };

    cargar();
  }, [router]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const url = brandingId
      ? `${process.env.NEXT_PUBLIC_API_URL}/branding/${brandingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/branding`;

    const method = brandingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (res.ok) {
        alert("Branding guardado correctamente");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Error al guardar branding: ${data?.error || res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al guardar branding");
    }
  };

  return (
    <RequirePermiso modulo="branding" accion="ver" fallback={null}>
      <FormularioTabla
        titulo="Configuración de empresa"
        campos={campos}
        valores={valores}
        registroId={Number(valores.id)}
        tabla="branding"
        onChange={handleChange}
        onSubmit={puedeEditar ? handleSubmit : undefined}
        botonTexto={brandingId ? "Actualizar" : "Guardar"}
        soloLectura={!puedeEditar}
      />
    </RequirePermiso>
  );
}
