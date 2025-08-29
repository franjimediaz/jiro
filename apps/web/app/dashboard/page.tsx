'use client';

import styles from './inicio.module.css';
import Link from 'next/link';

export default function InicioPage() {
  return (
    <main className={styles.inicioContainer}>
      <section className={styles.hero}>
        <h1>Bienvenido a JiRo</h1>
        <p>Tu sistema integral para gestionar negocios de forma inteligente y flexible</p>
        <div className={styles.botones}>
          <Link href="/obras" className={styles.btn}>Gestión de Obras</Link>
          <Link href="/clinicas" className={styles.btn}>Clínicas y Pacientes</Link>
          <Link href="/autonomos" className={styles.btn}>Módulo Autónomos</Link>
        </div>
      </section>

      <section className={styles.secciones}>
        <div className={styles.card}>
          <h2>📊 Panel de Control</h2>
          <p>Visualiza KPIs, estadísticas y notificaciones en un solo lugar.</p>
        </div>
        <div className={styles.card}>
          <h2>🔧 Módulos Personalizables</h2>
          <p>Activa o desactiva funcionalidades según tu tipo de negocio.</p>
        </div>
        <div className={styles.card}>
          <h2>⚙️ Configuración Avanzada</h2>
          <p>Gestiona usuarios, permisos, y personaliza cada detalle.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} JiRo CRM - Todos los derechos reservados</p>
      </footer>
    </main>
  );
}
