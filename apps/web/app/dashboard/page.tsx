"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./inicio.module.css";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type KPIsObras = {
  totalObras: number;
  obrasActivas: number;
  tareasPendientesHoy: number;
  tareasPendientesSemana: number;
  obrasPorEstado: { estado: string; total: number }[];
  obrasPorMes: { mes: string; total: number }[]; // mes: 'YYYY-MM'
  avanceMedio: number; // 0..100
  importeTotalPresupuestado: number;
};

export default function InicioPage() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  const [kpis, setKpis] = useState<KPIsObras | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- Carga de datos: intenta /kpis/obras y si no existe, usa /obras/count como fallback
  useEffect(() => {
    (async () => {
      try {
        // 1) Intento de KPIs completos
        const res = await fetch(`${API}/kpis/obras`);
        if (!res.ok) throw new Error("No KPIs endpoint");
        const data = await res.json();
        setKpis(normalizeKpis(data));
      } catch {
        // 2) Fallback: solo contamos obras (tu endpoint actual)
        try {
          const cRes = await fetch(`${API}/obras/count`);
          const cData = await cRes.json();
          setKpis({
            totalObras: Number(cData?.count ?? 0),
            obrasActivas: Number(cData?.count ?? 0), // si no hay distinción, igualamos
            tareasPendientesHoy: 0,
            tareasPendientesSemana: 0,
            obrasPorEstado: [],
            obrasPorMes: [],
            avanceMedio: 0,
            importeTotalPresupuestado: 0,
          });
        } catch {
          setKpis(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [API]);

  // --- Derivados para gráficos
  const pieData = useMemo(
    () =>
      (kpis?.obrasPorEstado || []).map((e) => ({
        name: e.estado || "Sin estado",
        value: e.total,
      })),
    [kpis]
  );

  const barData = useMemo(() => {
    const arr = kpis?.obrasPorMes || [];
    return arr.map((d) => {
      // Verificar que d.mes existe y es un string válido
      if (!d.mes || typeof d.mes !== "string" || !d.mes.includes("-")) {
        return { mes: "Sin fecha", total: d.total || 0 };
      }

      // d.mes => 'YYYY-MM' -> etiqueta corta 'MMM YY'
      const parts = d.mes.split("-");

      // Verificar que tenemos exactamente 2 partes
      if (parts.length !== 2) {
        return { mes: "Formato inválido", total: d.total || 0 };
      }

      const y = Number(parts[0]);
      const m = Number(parts[1]);

      // Verificar que los valores son números válidos
      if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
        return { mes: "Fecha inválida", total: d.total || 0 };
      }

      const label = new Date(y, m - 1, 1).toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });
      return { mes: label, total: d.total };
    });
  }, [kpis]);

  const num = (n: number) =>
    new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n);

  if (loading) {
    return <main className={styles.loader}>Cargando dashboard…</main>;
  }

  if (!kpis) {
    return (
      <main className={styles.errorBox}>
        <h2>No se pudieron cargar las estadísticas</h2>
        <p>
          Verifica que el backend esté activo en <code>{API}</code> y que exista
          la ruta <code>/kpis/obras</code> o <code>/obras/count</code>.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.inicioContainer}>
      {/* HERO */}
      <section className={styles.hero}>
        <h1>Bienvenido a JiRo</h1>
        <p>
          Tu sistema integral para gestionar obras de forma inteligente y
          flexible
        </p>
        <div className={styles.botones}>
          <Link href="/obras" className={styles.btn}>
            Gestión de Obras
          </Link>
          <Link href="/obras/presupuestos" className={styles.btnSec}>
            Presupuestos
          </Link>
          <Link href="/materiales" className={styles.btnSec}>
            Materiales
          </Link>
        </div>

        {/* Barra de búsqueda */}
        <input
          type="search"
          placeholder="Buscar módulo, obra o cliente…"
          className={styles.searchBar}
        />
      </section>

      {/* KPIs */}
      <section className={styles.kpisGrid}>
        <Kpi title="Obras Totales" value={num(kpis.totalObras)} />
        <Kpi title="Obras Activas" value={num(kpis.obrasActivas)} />
        <Kpi title="Avance Medio" value={`${num(kpis.avanceMedio)} %`} />
        <Kpi title="Tareas (hoy)" value={num(kpis.tareasPendientesHoy)} />
        <Kpi title="Tareas (semana)" value={num(kpis.tareasPendientesSemana)} />
        <Kpi
          title="Importe Presupuestado"
          value={`${num(kpis.importeTotalPresupuestado)} €`}
        />
      </section>

      {/* Gráficos */}
      <section className={styles.chartsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Obras por estado</h2>
          </div>
          <div className={styles.cardBody}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie dataKey="value" data={pieData} outerRadius={100} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Obras creadas por mes</h2>
          </div>
          <div className={styles.cardBody}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Obras" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Tarjetas informativas */}
      <section className={styles.secciones}>
        <div className={styles.infoCard}>
          <h2>📊 Panel de Control</h2>
          <p>Visualiza KPIs, estadísticas y notificaciones en un solo lugar.</p>
        </div>
        <div className={styles.infoCard}>
          <h2>⚙️ Configuración Avanzada</h2>
          <p>Gestiona usuarios, permisos, y personaliza cada detalle.</p>
        </div>
      </section>

      {/* Notificaciones (placeholder simple) */}
      <section className={styles.notifications}>
        <h3>🔔 Notificaciones recientes</h3>
        <ul>
          <li>Nueva obra creada</li>
          <li>Presupuesto aceptado</li>
          <li>Tarea marcada como completada</li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <p>
          © {new Date().getFullYear()} JiRo CRM - Todos los derechos reservados
        </p>
      </footer>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiTitle}>{title}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}

// Normaliza campos por si el backend devuelve claves distintas o strings
function normalizeKpis(raw: any): KPIsObras {
  return {
    totalObras: Number(raw?.totalObras ?? raw?.obras ?? raw?.count ?? 0),
    obrasActivas: Number(raw?.obrasActivas ?? 0),
    tareasPendientesHoy: Number(raw?.tareasPendientesHoy ?? 0),
    tareasPendientesSemana: Number(raw?.tareasPendientesSemana ?? 0),
    obrasPorEstado: Array.isArray(raw?.obrasPorEstado)
      ? raw.obrasPorEstado.map((x: any) => ({
          estado: String(x?.estado ?? x?.name ?? "Sin estado"),
          total: Number(x?.total ?? x?._count ?? 0),
        }))
      : [],
    obrasPorMes: Array.isArray(raw?.obrasPorMes)
      ? raw.obrasPorMes.map((x: any) => ({
          mes: String(x?.mes ?? x?.month ?? ""),
          total: Number(x?.total ?? 0),
        }))
      : [],
    avanceMedio: Number(raw?.avanceMedio ?? raw?.avgAvance ?? 0),
    importeTotalPresupuestado: Number(
      raw?.importeTotalPresupuestado ?? raw?.importe ?? 0
    ),
  };
}
