'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';
import { useRouter } from 'next/navigation';
import { obtenerModulosJerarquicos } from '../system/modulos/modulosService';

const Sidebar = () => {
  const [modulos, setModulos] = useState<any[]>([]);
  const [moduloActivo, setModuloActivo] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cargar = async () => {
      const jerarquico = await obtenerModulosJerarquicos();
      setModulos(asignarPadres(jerarquico));
    };
    cargar();
  }, []);
  const handleLogout = () => {
    // Aquí puedes limpiar cookies, localStorage o llamar a una API de logout
    localStorage.removeItem('token'); // ejemplo
    router.push('/login');
  };
  const asignarPadres = (lista: any[], padre: any = null): any[] =>
    lista.map((modulo) => {
      const copia = { ...modulo, padre };
      if (modulo.hijos?.length) {
        copia.hijos = asignarPadres(modulo.hijos, copia);
      }
      return copia;
    });

  const irHacia = (modulo: any) => {
  if (modulo.ruta) {
    router.push(modulo.ruta); // Siempre navega a la ruta
  }
  if (modulo.hijos?.length) {
    setModuloActivo(modulo); 
  }
};

  const listaActual = moduloActivo ? moduloActivo.hijos : modulos;

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.title}>
      <h2>JiRo</h2>
      </Link>
      <nav className={styles.nav}>
        {moduloActivo && (
          <button className={styles.volver} onClick={() => setModuloActivo(moduloActivo.padre)}>
            ←
          </button>
        )}
        {listaActual.map((modulo: any, i: number) => (
          <button
            key={i}
            className={styles.link}
            onClick={() => irHacia(modulo)}
          >
            {modulo.nombre}
          </button>
        ))}
      </nav>
      <div className={styles.logoutContainer}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
