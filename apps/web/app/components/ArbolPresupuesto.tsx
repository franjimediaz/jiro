"use client";

import { useEffect, useState } from "react";
import styles from "./ArbolPresupuesto.module.css";
import { generarPDFPresupuesto } from "./utils/generarPDFPresupuesto";
import {
  ServicioPresupuesto,
  ClienteInfo,
  EmpresaBranding,
  ArbolPresupuestoProps,
} from "../../types/presupuesto";
import ModalGenerarFactura from "../obras/presupuestos/utils/ModalGenerarFactura";
import { useRouter } from "next/navigation";
interface ServicioPresupuestoConId extends ServicioPresupuesto {
  id: number; // id del Presupuesto_Servicio
}

export default function ArbolPresupuesto({
  presupuestoId,
}: ArbolPresupuestoProps) {
  const [estructura, setEstructura] = useState<ServicioPresupuestoConId[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abiertos, setAbiertos] = useState<{ [clave: string]: boolean }>({});
  const [empresa, setEmpresa] = useState<EmpresaBranding | null>(null);
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(21);
  const [descuentoTipo, setDescuentoTipo] = useState<"porcentaje" | "valor">(
    "porcentaje"
  );
  const [descuentoValor, setDescuentoValor] = useState(0);
  const [nombrePresupuesto, setNombrePresupuesto] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [mostrarModalFactura, setMostrarModalFactura] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const router = useRouter();

  const guardarCambios = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${presupuestoId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ivaPorcentaje,
            descuentoTipo,
            descuentoValor,
            importe: totalConIva,
          }),
        }
      );
      if (!res.ok)
        throw new Error("Error al guardar los datos del presupuesto");
      alert("✅ IVA y descuento guardados correctamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar");
    }
  };

  useEffect(() => {
    const fetchDatosEmpresaYCliente = async () => {
      try {
        const resEmpresa = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/branding`,
          {
            credentials: "include",
          }
        );
        const dataEmpresa = await resEmpresa.json();
        setEmpresa(dataEmpresa);

        const resCliente = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${presupuestoId}/cliente`,
          {
            credentials: "include",
          }
        );
        const dataCliente = await resCliente.json();
        console.log("👀 Resultado directo del fetch de cliente:", dataCliente);
        console.log("👀 Resultado directo del fetch de empresa:", dataEmpresa);
        setCliente(dataCliente);

        const resPresupuesto = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${presupuestoId}`,
          {
            credentials: "include",
          }
        );
        const dataPresupuesto = await resPresupuesto.json();
        setNombrePresupuesto(dataPresupuesto.nombre || "Presupuesto detallado");
        setCondiciones(dataPresupuesto.condiciones);
      } catch (error) {
        console.error("❌ Error cargando empresa o cliente:", error);
      } finally {
        setLoadingDatos(false);
      }
    };

    fetchDatosEmpresaYCliente();
  }, [presupuestoId]);

  useEffect(() => {
    const fetchArbol = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${presupuestoId}/arbol`,
          {
            credentials: "include",
          }
        );
        if (!res.ok)
          throw new Error("Error al cargar el árbol del presupuesto");
        const data: ServicioPresupuestoConId[] = await res.json();
        setEstructura(data);
      } catch (error) {
        console.error("❌ Error al obtener árbol del presupuesto:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchArbol();
  }, [presupuestoId]);

  useEffect(() => {
    if (!estructura.length) return;

    const serviciosConTotales = estructura.map((servicio, index) => {
      const total = servicio.tareas.reduce(
        (acc, tarea) => acc + (tarea.total || 0),
        0
      );

      return {
        id: servicio.id, // Si no hay un ID real, puedes usar el índice temporalmente
        nombre: servicio.servicioNombre || `Servicio ${index + 1}`,
        total: Number(total.toFixed(2)), // para evitar decimales extraños
      };
    });

    setServicios(serviciosConTotales);
    console.log(serviciosConTotales);
  }, [estructura]);

  const toggleNodo = (clave: string) => {
    setAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  const subtotal = estructura.reduce((acc, servicio) => {
    return (
      acc +
      servicio.tareas.reduce((tAcc, tarea) => tAcc + (tarea.total ?? 0), 0)
    );
  }, 0);

  const descuento =
    descuentoTipo === "porcentaje"
      ? subtotal * (descuentoValor / 100)
      : descuentoValor;

  const baseImponible = subtotal - descuento;
  const iva = baseImponible * (ivaPorcentaje / 100);
  const totalConIva = baseImponible + iva;

  const handleGenerarPDF = () => {
    if (!empresa || !empresa.nombre || !empresa.direccion) {
      alert("❌ Datos de la empresa incompletos");
      return;
    }

    if (!cliente || !cliente.nombre || !cliente.direccion) {
      alert("❌ Datos del cliente incompletos");
      return;
    }

    generarPDFPresupuesto(
      estructura,
      ivaPorcentaje,
      descuentoTipo,
      descuentoValor,
      empresa,
      cliente,
      nombrePresupuesto,
      condiciones
    );
  };
  const handleFacturaCreada = (idFactura: number) => {
    setMostrarModalFactura(false);
    router.push(`/obras/presupuestos/facturas/${idFactura}`);
  };
  if (cargando) return <p>Cargando estructura del presupuesto...</p>;
  if (!estructura.length) return <p>No hay datos disponibles.</p>;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.titulo}>Presupuesto</h3>

      {estructura.map((servicio, idx) => {
        const claveServicio = `servicio-${idx}`;
        const abiertoServicio = abiertos[claveServicio] ?? false;
        const totalServicio = servicio.tareas.reduce((acc, tarea) => {
          return acc + (tarea.total ?? 0);
        }, 0);

        return (
          <div key={claveServicio} className={styles.nodo}>
            <div
              className={`${styles.toggle} ${abiertoServicio ? styles.abierto : ""}`}
              onClick={() => toggleNodo(claveServicio)}
            >
              {servicio.servicioNombre || "Servicio sin nombre"}:{" "}
              {totalServicio.toFixed(2)} €
            </div>
            {abiertoServicio && (
              <div>
                {servicio.tareas.map((tarea, tIdx) => {
                  const claveTarea = `${claveServicio}-tarea-${tIdx}`;
                  const abiertoTarea = abiertos[claveTarea] ?? false;

                  return (
                    <div key={claveTarea} className={styles.nodo}>
                      <div
                        className={`${styles.toggle} ${abiertoTarea ? styles.abierto : ""}`}
                        onClick={() => toggleNodo(claveTarea)}
                      >
                        {tarea.nombre || "Tarea sin descripción"} —{" "}
                        <strong>
                          {tarea.cantidad ?? 0} x{" "}
                          {(tarea.precioManoObra ?? 0).toFixed(2)} €
                        </strong>
                      </div>
                      {abiertoTarea && (
                        <div>
                          {tarea.materiales.map((material, mIdx) => (
                            <div key={mIdx} className={styles.material}>
                              {material.nombre || "Material sin nombre"}:{" "}
                              {material.cantidad ?? 0} x
                              {(material.precioUnidad ?? 0).toFixed(2)} €
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Resumen económico */}
      <div className={styles.resumen}>
        <p>
          <strong>Subtotal:</strong> {subtotal.toFixed(2)} €
        </p>
        <p>
          <strong>Descuento:</strong> -{descuento.toFixed(2)} €
        </p>
        <p>
          <strong>Base Imponible:</strong> {baseImponible.toFixed(2)} €
        </p>
        <p>
          <strong>IVA ({ivaPorcentaje}%):</strong> +{iva.toFixed(2)} €
        </p>
        <p>
          <strong>Total con IVA:</strong> {totalConIva.toFixed(2)} €
        </p>
      </div>

      {/* Variables de configuración */}
      <div className={styles.variablesBox}>
        <h4>Variables</h4>

        <div className={styles.campoControl}>
          <label htmlFor="iva">IVA (%):</label>
          <input
            type="number"
            id="iva"
            value={ivaPorcentaje}
            onChange={(e) => setIvaPorcentaje(Number(e.target.value))}
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        <div className={styles.campoControl}>
          <label htmlFor="descuentoTipo">Tipo</label>
          <select
            id="descuentoTipo"
            value={descuentoTipo}
            onChange={(e) =>
              setDescuentoTipo(e.target.value as "porcentaje" | "valor")
            }
          >
            <option value="porcentaje">%</option>
            <option value="valor">€</option>
          </select>
        </div>

        <div className={styles.campoControl}>
          <label htmlFor="descuentoValor">Valor</label>
          <input
            type="number"
            id="descuentoValor"
            value={descuentoValor}
            onChange={(e) => setDescuentoValor(Number(e.target.value))}
            min={0}
            step={0.01}
          />
        </div>

        <button className={styles.botonPDF} onClick={guardarCambios}>
          Guardar IVA y descuento
        </button>

        <button
          className={styles.botonPDF}
          onClick={handleGenerarPDF}
          disabled={loadingDatos}
        >
          Generar PDF
        </button>
        <button
          className={styles.botonPDF}
          onClick={() => setMostrarModalFactura(true)}
          disabled={loadingDatos}
        >
          Generar Factura
        </button>
        {mostrarModalFactura && cliente && empresa && (
          <ModalGenerarFactura
            presupuestoId={presupuestoId}
            importePresupuesto={totalConIva}
            servicios={servicios}
            onClose={() => setMostrarModalFactura(false)}
            onFacturaCreada={handleFacturaCreada}
          />
        )}
      </div>
    </div>
  );
}
