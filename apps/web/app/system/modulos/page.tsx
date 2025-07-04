'use client';

import React, { useEffect, useState } from 'react';
import TablaFractal from '../../components/TablaFractal';
import { obtenerModulosJerarquicos } from './modulosService'; // servicio ficticio para ejemplo
import BotonInicializarModulos from './utils/BotonInicializarModulos';

const PageModulos = () => {
  const [modulos, setModulos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarModulos = async () => {
      setCargando(true);
      const resultado = await obtenerModulosJerarquicos();
      setModulos(resultado);
      setCargando(false);
    };

    cargarModulos();
  }, []);

  const columnas = [
    { clave: 'nombre', encabezado: 'Nombre' },
    { clave: 'ruta', encabezado: 'Ruta' },
    { clave: 'orden', encabezado: 'Orden' },
    {
      clave: 'icono',
      encabezado: 'Icono',
      render: (valor: string) => valor ? <span>{valor}</span> : '—',
    },
  ];

  //-----------------------------------
  

  const handleEditar = (modulo: any) => {
    console.log('Editar módulo', modulo);
    // Aquí podrías redirigir a /system/modulos/[id]?edit=true
  };

  const handleEliminar = (modulo: any) => {
    console.log('Eliminar módulo', modulo);
    // Aquí deberías mostrar un modal de confirmación
  };

  return (
    <div className="modulos-page">
      <h1>Gestión de Módulos</h1>
      {cargando ? (
        <p>Cargando módulos...</p>
        
      ) : (
        <>
        <BotonInicializarModulos />
        <TablaFractal
          titulo="Módulos del sistema"
          columnas={columnas}
          datos={modulos}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
        />
        </>
      )}
    </div>
  );
};

export default PageModulos;
