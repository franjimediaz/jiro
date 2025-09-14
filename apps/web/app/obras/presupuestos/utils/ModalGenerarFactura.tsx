// components/ModalGenerarFactura.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ModalGenerarFactura.module.css";
import { usePermisos } from "../../../lib/permisos";

interface Servicio {
  id: number;
  nombre: string;
  total: number | null | undefined;
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
  const router = useRouter();
  const { can } = usePermisos();

  const [tipo, setTipo] = useState<"porcentaje" | "importe" | "servicios">(
    "porcentaje"
  );
  const [valor, setValor] = useState<number>(0);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    number[]
  >([]);
  const [enviando, setEnviando] = useState(false);

  const puedeCrear = can("facturas", "crear");

  const calcularCantidad = (): { cantidad: number; serviciosIds: number[] } => {
    let cantidad = 0;
    let serviciosIds: number[] = [];

    if (tipo === "porcentaje") {
      const pct = isNaN(valor) ? 0 : Math.max(0, Math.min(100, valor));
      cantidad = Number(((importePresupuesto || 0) * (pct / 100)).toFixed(2));
    } else if (tipo === "importe") {
      cantidad = Number((valor || 0).toFixed(2));
    } else {
      const seleccionados = servicios.filter((s) =>
        serviciosSeleccionados.includes(s.id)
      );
      cantidad = Number(
        seleccionados.reduce((sum, s) => sum + (s.total ?? 0), 0).toFixed(2)
      );
      serviciosIds = seleccionados.map((s) => s.id);
    }

    return { cantidad, serviciosIds };
  };

  const handleGenerar = async () => {
    if (!puedeCrear) {
      router.replace("/403");
      return;
    }

    const { cantidad, serviciosIds } = calcularCantidad();

    if (!cantidad || cantidad <= 0) {
      alert("Introduce una cantidad válida mayor que 0.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presupuestoId,
          cantidad,
          servicioIds: serviciosIds,
        }),
      });

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      const data = await res.json().catch(() => ({}) as any);
      if (res.ok && data?.id) {
        onFacturaCreada(data.id);
      } else {
        const msg =
          data?.message ||
          data?.error ||
          "No se pudo crear la factura. Inténtalo de nuevo.";
        alert(msg);
      }
    } catch (err: any) {
      console.error("Error creando factura:", err);
      alert(err?.message || "Error desconocido al crear la factura");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Generar factura</h2>

        {!puedeCrear && (
          <p style={{ margin: "0 0 1rem", color: "#b45309", fontWeight: 600 }}>
            No tienes permiso para crear facturas.
          </p>
        )}

        <div className={styles.selectorTipo}>
          <label>
            <input
              type="radio"
              name="tipo"
              value="porcentaje"
              checked={tipo === "porcentaje"}
              onChange={() => setTipo("porcentaje")}
              disabled={!puedeCrear || enviando}
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
              disabled={!puedeCrear || enviando}
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
              disabled={!puedeCrear || enviando}
            />
            Servicios
          </label>
        </div>

        {tipo === "porcentaje" && (
          <input
            type="number"
            placeholder="Porcentaje"
            min={0}
            max={100}
            step={0.01}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            disabled={!puedeCrear || enviando}
          />
        )}

        {tipo === "importe" && (
          <input
            type="number"
            placeholder="Importe (€)"
            min={0}
            step={0.01}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            disabled={!puedeCrear || enviando}
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
                      setServiciosSeleccionados((prev) => [...prev, serv.id]);
                    } else {
                      setServiciosSeleccionados((prev) =>
                        prev.filter((id) => id !== serv.id)
                      );
                    }
                  }}
                  disabled={!puedeCrear || enviando}
                />
                {serv.nombre} — {Number(serv.total ?? 0).toFixed(2)} €
              </label>
            ))}
          </div>
        )}

        <div className={styles.acciones}>
          <button onClick={handleGenerar} disabled={!puedeCrear || enviando}>
            {enviando ? "Creando..." : "Crear factura"}
          </button>
          <button onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGenerarFactura;
