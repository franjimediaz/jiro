"use client";
import { useEffect, useState } from "react";
import styles from "./DatosEmpresaCliente.module.css";

type Props = {
  clienteId: number;
};

export default function DatosEmpresaCliente({ clienteId }: Props) {
  const [cliente, setCliente] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    // Obtener datos del cliente
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setCliente(data))
      .catch((err) => console.error("Error al cargar cliente", err));
  }, [clienteId]);

  useEffect(() => {
    // Obtener datos de empresa (branding)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setBranding(data))
      .catch((err) => console.error("Error al cargar branding", err));
  }, []);

  if (!cliente || !branding) return <p>Cargando datos...</p>;

  return (
    <div className={styles.contenedor}>
      <div className={styles.tarjeta}>
        <h3>Empresa</h3>
        <p>
          <strong>Nombre:</strong> {branding.nombre}
        </p>
        <p>
          <strong>CIF:</strong> {branding.CIF}
        </p>
        <p>
          <strong>Dirección:</strong> {branding.direccion}
        </p>
        <p>
          <strong>Teléfono:</strong> {branding.telefono}
        </p>
        <p>
          <strong>Email:</strong> {branding.email}
        </p>
      </div>
      <div className={styles.tarjeta}>
        <h3>Cliente</h3>
        <p>
          <strong>Nombre:</strong> {cliente.nombre}
        </p>
        <p>
          <strong>NIF:</strong> {cliente.dni}
        </p>
        <p>
          <strong>Dirección:</strong> {cliente.direccion}
        </p>
        <p>
          <strong>Teléfono:</strong> {cliente.telefono}
        </p>
        <p>
          <strong>Email:</strong> {cliente.email}
        </p>
      </div>
    </div>
  );
}
