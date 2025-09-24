"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import styles from "./Sidebar.module.css";
import { useRouter } from "next/navigation";
import { obtenerModulosJerarquicos } from "../system/modulos/modulosService";

const Sidebar = () => {
  const [modulos, setModulos] = useState<any[]>([]);
  const [moduloActivo, setModuloActivo] = useState<any | null>(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const cargar = async () => {
      const jerarquico = await obtenerModulosJerarquicos();
      setModulos(asignarPadres(jerarquico));
    };
    cargar();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuUsuarioAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
    router.push("/login");
  };

  const handlePerfil = () => {
    setMenuUsuarioAbierto(false);
    router.push("/perfil"); // Ajusta la ruta según tu estructura
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
          <button
            className={styles.volver}
            onClick={() => setModuloActivo(moduloActivo.padre)}
          >
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
      {/* Menú de usuario */}
      <div className={styles.userMenuContainer} ref={menuRef}>
        <button
          className={styles.userButton}
          onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
        >
          <div className={styles.userAvatar}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Usuario</span>
            <span className={styles.userRole}>Administrador</span>
          </div>
          <svg
            className={`${styles.chevron} ${menuUsuarioAbierto ? styles.rotated : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m18 15-6-6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Menú desplegable */}
        <div
          className={`${styles.dropdownMenu} ${menuUsuarioAbierto ? styles.open : ""}`}
        >
          <button className={styles.dropdownItem} onClick={handlePerfil}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Mi Perfil
          </button>

          <div className={styles.divider}></div>

          <button
            className={`${styles.dropdownItem} ${styles.logout}`}
            onClick={handleLogout}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="16,17 21,12 16,7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="21"
                y1="12"
                x2="9"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
