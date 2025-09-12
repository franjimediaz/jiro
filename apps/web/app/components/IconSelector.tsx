"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom"; // ✅ Importar createPortal
import { iconMap, iconNames } from "./utils/iconMap";
import styles from "./IconSelector.module.css";

type Props = {
  valor?: string;
  onChange: (icono: string) => void;
};

const IconSelector: React.FC<Props> = ({ valor, onChange }) => {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false); // ✅ Para hidratación
  const botonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const IconActual = valor && iconMap[valor as keyof typeof iconMap];

  // ✅ Asegurar que está montado (hidratación)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Calcular posición cuando se abre
  useEffect(() => {
    if (abierto && botonRef.current) {
      const rect = botonRef.current.getBoundingClientRect();
      const popupWidth = 370; // Ancho del popup
      const popupHeight = 250; // Alto máximo del popup
      const spacing = 8; // Espacio entre botón y popup

      // Calcular posición preferida (a la derecha)
      let left = rect.right + spacing;
      let top = rect.top;

      // ✅ Ajustar si se sale de la pantalla por la derecha
      if (left + popupWidth > window.innerWidth) {
        left = rect.left - popupWidth - spacing; // Mover a la izquierda
      }

      // ✅ Ajustar si se sale de la pantalla por la izquierda
      if (left < 0) {
        left = rect.left; // Alinear con el botón
        top = rect.bottom + spacing; // Mover abajo
      }

      // ✅ Ajustar si se sale de la pantalla por abajo
      if (top + popupHeight > window.innerHeight) {
        top = rect.top - popupHeight - spacing; // Mover arriba
      }

      // ✅ Asegurar que no se salga por arriba
      if (top < 0) {
        top = spacing;
      }

      console.log("Posición calculada:", {
        top: top + window.scrollY,
        left: left + window.scrollX,
        buttonRect: rect,
        windowSize: { width: window.innerWidth, height: window.innerHeight },
      });

      setPosicion({
        top: top + window.scrollY,
        left: left + window.scrollX,
      });
    }
  }, [abierto]);

  // ✅ Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        botonRef.current &&
        !botonRef.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    };

    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, [abierto]);

  // ✅ Portal content
  const portalContent =
    abierto && mounted ? (
      <>
        {/* Overlay */}
        <div
          className={styles.overlay}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999998,
            backgroundColor: "rgba(0, 0, 0, 0.1)", // ✅ Fallback inline
          }}
          onClick={() => setAbierto(false)}
        />

        {/* Popup */}
        <div
          ref={popupRef}
          className={styles.popup}
          style={{
            position: "fixed",
            top: `${posicion.top}px`,
            left: `${posicion.left}px`,
            zIndex: 999999,
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            width: "370px",
            maxHeight: "250px",
            overflowY: "auto",
          }}
        >
          <div className={styles.iconGrid}>
            {iconNames.map((nombre) => {
              const Icon = iconMap[nombre as keyof typeof iconMap];
              return (
                <div
                  key={nombre}
                  className={styles.icono}
                  onClick={() => {
                    console.log("Icono seleccionado:", nombre);
                    onChange(nombre);
                    setAbierto(false);
                  }}
                >
                  <Icon size={18} />
                  <span className={styles.iconoNombre}>{nombre}</span>
                </div>
              );
            })}
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      <div className={`${styles.wrapper} ${abierto ? styles.abierto : ""}`}>
        <button
          ref={botonRef}
          type="button"
          onClick={() => {
            console.log("Botón clickeado, abierto:", !abierto); // ✅ Debug
            setAbierto(!abierto);
          }}
          className={styles.boton}
        >
          {IconActual ? <IconActual size={20} /> : "Seleccionar icono"}
          <span className={styles.flecha}>{abierto ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* ✅ Usar React Portal para renderizar fuera del DOM tree */}
      {mounted &&
        typeof window !== "undefined" &&
        createPortal(portalContent, document.body)}
    </>
  );
};

export default IconSelector;
