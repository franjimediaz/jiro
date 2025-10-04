"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      });

      // Si la API devuelve 204 o un error sin JSON, evita romper el .json()
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignoramos si no hay body JSON
      }

      if (res.ok) {
        //  Cookie httpOnly ya quedó guardada por el navegador
        router.push("/dashboard");
      } else {
        setError(data?.error ?? "Credenciales incorrectas");
      }
    } catch (err: any) {
      setError(err?.message ?? "Error desconocido al iniciar sesión");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.contenidoLogin}>
          <h2 className={styles.title}>Iniciar sesión</h2>
          <form onSubmit={handleLogin}>
            <input
              className={styles.input}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className={styles.button} type="submit">
              Entrar
            </button>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.forgotPassword}>
              <a href="/recuperar">¿Ha olvidado su contraseña?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
