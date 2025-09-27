// ModalGenerarFactura.tsx  (coloca este archivo en tu ruta real)
// "use client" porque usa hooks y eventos
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ModalGenerarFactura.module.css";
import { usePermisos } from "../lib/permisos";

// Helpers para evitar renderizar bigint/objetos en JSX y para formato moneda
const toDisplay = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "-";
  return typeof v === "bigint" ? v.toString() : String(v);
};

const toNumber = (v: unknown): number => {
  const n = typeof v === "bigint" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toCurrency = (v: unknown, currency: string = "EUR"): string =>
  toNumber(v).toLocaleString("es-ES", { style: "currency", currency });

type Servicio = {
  id: number | string | bigint;
  nombre: string;
  total: number | string | bigint | null | undefined;
};

type Props = {
  presupuestoId: number | string | bigint;
  importePresupuesto: number | string | bigint;
  servicios: Servicio[];
  onClose: () => void;
  onFacturaCreada: (idFactura: number) => void;
};

export default function ModalGenerarFactura({
  presupuestoId,
  importePresupuesto,
  servicios,
  onClose,
  onFacturaCreada,
}: Props) {
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
      const base = toNumber(importePresupuesto);
      const pct = Math.max(
        0,
        Math.min(100, Number.isFinite(valor) ? valor : 0)
      );
      cantidad = Math.round(base * (pct / 100) * 100) / 100;
    } else if (tipo === "importe") {
      cantidad = Math.round(toNumber(valor) * 100) / 100;
    } else {
      // Normalizamos IDs y sumamos totales de servicios marcados
      const seleccionados = servicios.filter((s) =>
        serviciosSeleccionados.includes(toNumber(s.id))
      );
      const suma = seleccionados.reduce((sum, s) => sum + toNumber(s.total), 0);
      cantidad = Math.round(suma * 100) / 100;
      serviciosIds = seleccionados.map((s) => toNumber(s.id));
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
          presupuestoId: toNumber(presupuestoId), // 👈 evitamos BigInt en JSON
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

      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data?.id) {
        onFacturaCreada(Number(data.id));
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
            Importe ({toCurrency(importePresupuesto)})
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
            {servicios.map((serv) => {
              const idNum = toNumber(serv.id);
              return (
                <label key={`${idNum}-${toDisplay(serv.nombre)}`}>
                  <input
                    type="checkbox"
                    checked={serviciosSeleccionados.includes(idNum)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setServiciosSeleccionados((prev) => [...prev, idNum]);
                      } else {
                        setServiciosSeleccionados((prev) =>
                          prev.filter((id) => id !== idNum)
                        );
                      }
                    }}
                    disabled={!puedeCrear || enviando}
                  />
                  {toDisplay(serv.nombre)} — {toCurrency(serv.total)}
                </label>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "0.75rem", fontWeight: 600 }}>
          Total a facturar:{" "}
          <span>{toCurrency(calcularCantidad().cantidad)}</span>
        </div>

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
}
