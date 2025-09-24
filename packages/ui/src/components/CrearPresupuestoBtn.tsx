"use client";

import React from "react";
import styles from "./CrearPresupuestoBtn.module.css";
import { iconMap } from "./utils/iconMap"; // ruta relativa si estás en app/, ajusta si es diferente

interface CrearPresupuestoBtnProps {
  clienteId: number;
  obraId: number;
  nombre?: string;
  descripcion?: string;
  onSuccess?: (presupuesto: any) => void;
  icono?: keyof typeof iconMap; // <-- ahora acepta string como 'FileText'
}

export default function CrearPresupuestoBtn({
  clienteId,
  obraId,
  nombre = "Presupuesto sin título",
  descripcion = "Descripción pendiente",
  onSuccess,
  icono = "FileText",
}: CrearPresupuestoBtnProps) {
  const Icon = iconMap[icono]; // <-- extraemos el componente

  const handleClick = async () => {
    try {
      // ✅ 1. Obtener el importe automático desde el backend
      const resImporte = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/importe-por-obra/${obraId}`,
        {
          credentials: "include",
        }
      );
      const dataImporte = await resImporte.json();

      if (!resImporte.ok || dataImporte.importe === undefined) {
        throw new Error("No se pudo calcular el importe");
      }

      const importe = dataImporte.importe;
      const resBranding = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/branding`,
        {
          credentials: "include",
        }
      );
      const dataBranding = await resBranding.json();
      console.log("Branding recibido:", dataBranding);
      const condiciones = dataBranding?.CondicionesPresupuesto || "";

      // ✅ 2. Crear el presupuesto con el importe incluido
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clienteId,
            obraId,
            nombre,
            descripcion,
            importe, // <-- aquí se envía el importe
            condiciones,
          }),
        }
      );

      if (!res.ok) {
        const mensaje = await res.text();
        throw new Error(`Error al crear presupuesto: ${mensaje}`);
      }

      const presupuestoCreado = await res.json();
      console.log("✅ Presupuesto creado:", presupuestoCreado);

      if (onSuccess) onSuccess(presupuestoCreado);
    } catch (err) {
      console.error("❌ Error al crear presupuesto", err);
      alert("Error al crear presupuesto");
    }
  };

  return (
    <button onClick={handleClick} className="boton-flotante">
      {Icon && <Icon size={20} />}
      <p>Crear Presupuesto</p>
    </button>
  );
}
