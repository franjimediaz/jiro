"use client";
import React from "react";
import {
  modulosIniciales,
  insertarModulosJerarquicos,
} from "../modulosService";

const BotonInicializarModulos = () => {
  const handleInicializar = async () => {
    if (!confirm("¿Seguro que quieres reinicializar los módulos?")) return;
    try {
      await insertarModulosJerarquicos(modulosIniciales);
      alert("✅ Módulos creados correctamente");
      window.location.reload(); // recargar la vista de módulos
    } catch (error) {
      console.error("Error al inicializar módulos", error);
      alert("❌ Error al crear módulos");
    }
  };
  const eliminarTodosLosModulos = async () => {
    try {
      const confirmacion = confirm(
        "¿Estás seguro de que quieres eliminar todos los módulos? Esta acción no se puede deshacer."
      );
      if (!confirmacion) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/modulos/all`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Error al eliminar los módulos");

      alert("✅ Módulos eliminados correctamente");
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Hubo un problema al eliminar los módulos");
    }
  };

  return (
    <div className="acciones-superiores">
      <button onClick={handleInicializar} className="btn btn-inicializar">
        🔄 Inicializar Módulos
      </button>
      <button
        onClick={eliminarTodosLosModulos}
        className="btn btn-eliminar-todo"
      >
        🗑️ Eliminar todos los módulos
      </button>
    </div>
  );
};

export default BotonInicializarModulos;
