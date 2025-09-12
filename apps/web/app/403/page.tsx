"use client";

import { useRouter } from "next/navigation";
import {
  ShieldXIcon,
  ArrowLeftIcon,
  HomeIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./403.module.css";

export default function ForbiddenPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.content} ${
          isVisible ? styles.contentVisible : styles.contentHidden
        }`}
      >
        {/* Icono principal con animación */}
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <ShieldXIcon className={styles.icon} />
          </div>

          {/* Código de error */}
          <h1 className={styles.errorCode}>403</h1>
          <h2 className={styles.errorTitle}>Acceso denegado</h2>
        </div>

        {/* Mensaje */}
        <div className={styles.message}>
          <p className={styles.messageText}>
            Lo sentimos, no tienes permisos suficientes para acceder a este
            contenido. Contacta con tu administrador si crees que esto es un
            error.
          </p>

          {/* Card de información */}
          <div className={styles.infoCard}>
            <div className={styles.infoContent}>
              <div className={styles.infoIconContainer}>
                <AlertTriangleIcon className={styles.infoIcon} />
              </div>
              <div className={styles.infoText}>
                <h3 className={styles.infoTitle}>Permisos insuficientes</h3>
                <p className={styles.infoDescription}>
                  Tu rol actual no tiene acceso a esta sección del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className={styles.buttonContainer}>
          <button
            onClick={handleGoBack}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            <ArrowLeftIcon className={styles.buttonIcon} />
            Volver atrás
          </button>

          <button
            onClick={handleGoHome}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            <HomeIcon className={styles.buttonIcon} />
            Ir al inicio
          </button>
        </div>

        {/* Enlaces adicionales */}
        <div className={styles.helpSection}>
          <p className={styles.helpText}>¿Necesitas ayuda?</p>
          <div className={styles.helpLinks}>
            <a href="/help" className={styles.helpLink}>
              Centro de ayuda
            </a>
            <a href="/contact" className={styles.helpLink}>
              Contactar soporte
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Error 403 - JiRo System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
