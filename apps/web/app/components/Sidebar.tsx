'use client';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Mi App</h2>
      <nav className={styles.nav}>
        <Link href="/obras">Obras</Link>
        <Link href="/clientes">Clientes</Link>
        <Link href="/empleados">Empleados</Link>
        {/* Añade más enlaces según tus módulos */}
      </nav>
    </aside>
  );
};

export default Sidebar;
