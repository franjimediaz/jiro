// components/ModalGenerarFactura.tsx
"use client";

import React, { useState } from "react";
import styles from "./ModalGenerarFactura.module.css";

interface Servicio {
  id: number;
  nombre: string;
  total: number;
}

interface Props {
  presupuestoId: number;
  importePresupuesto: number;
  servicios: Servicio[];
  onClose: () => void;
  onFacturaCreada: (idFactura: number) => void;
}

const ModalGenerarFactura: React.FC<Props> = ({
  presupuestoId,
  importePresupuesto,
  servicios,
  onClose,
  onFacturaCreada,
}) => {
  const [tipo, setTipo] = useState<"porcentaje" | "importe" | "servicios">(
    "porcentaje"
  );
  const [valor, setValor] = useState<number>(0);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    number[]
  >([]);

  const handleGenerar = async () => {
    let cantidad = 0;
    let serviciosIds: number[] = [];

    if (tipo === "porcentaje") {
      cantidad = Math.round((importePresupuesto * valor) / 100);
    } else if (tipo === "importe") {
      cantidad = valor;
    } else if (tipo === "servicios") {
      const seleccionados = servicios.filter((s) =>
        serviciosSeleccionados.includes(s.id)
      );
      cantidad = seleccionados.reduce((sum, s) => sum + s.total, 0);
      serviciosIds = seleccionados.map((s) => s.id);
    }
    console.log("🧾 Generando factura con:", {
      presupuestoId,
      cantidad,
      serviciosIds,
      tipoSeleccionado: tipo,
    });

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presupuestoId,
        cantidad,
        servicioIds: serviciosIds,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      onFacturaCreada(data.id);
    } else {
      alert("Error al crear factura: " + data?.message || "Desconocido");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Generar factura</h2>

        <div className={styles.selectorTipo}>
          <label>
            <input
              type="radio"
              name="tipo"
              value="porcentaje"
              checked={tipo === "porcentaje"}
              onChange={() => setTipo("porcentaje")}
            />
            Porcentaje
          </label>
          <label>
            <input
              type="radio"
              name="tipo"
              value="importe"
              checked={tipo === "importe"}
              onChange={() => setTipo("importe")}
            />
            Importe (€)
          </label>
          <label>
            <input
              type="radio"
              name="tipo"
              value="servicios"
              checked={tipo === "servicios"}
              onChange={() => setTipo("servicios")}
            />
            Servicios
          </label>
        </div>

        {tipo === "porcentaje" && (
          <input
            type="number"
            placeholder="Porcentaje"
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
          />
        )}
        {tipo === "importe" && (
          <input
            type="number"
            placeholder="Importe (€)"
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
          />
        )}
        {tipo === "servicios" && (
          <div className={styles.listaServicios}>
            {servicios.map((serv) => (
              <label key={serv.id}>
                <input
                  type="checkbox"
                  checked={serviciosSeleccionados.includes(serv.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setServiciosSeleccionados([
                        ...serviciosSeleccionados,
                        serv.id,
                      ]);
                    } else {
                      setServiciosSeleccionados(
                        serviciosSeleccionados.filter((id) => id !== serv.id)
                      );
                    }
                  }}
                />
                {serv.nombre} — {serv.total}€
              </label>
            ))}
          </div>
        )}

        <div className={styles.acciones}>
          <button onClick={handleGenerar}>Crear factura</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalGenerarFactura;
