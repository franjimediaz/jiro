'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioTabla from '../../components/FormularioTabla';


const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre' },
  { nombre: 'apellido', etiqueta: 'Apellido' },
  { nombre: 'email', etiqueta: 'Email'},
  { nombre: 'telefono', etiqueta: 'Teléfono'},
  { nombre: 'rol', etiqueta: 'Roles' },
  {nombre: 'activo',etiqueta: 'Activo', tipo: 'checkbox'},

];

export default function Nuevausuario() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: '',
    direccion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    clienteID:'',
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert('usuario creada correctamente');
      router.push('/usuarios');
    } else {
      alert('Error al crear la usuario');
    }
  };

  return (
    <FormularioTabla
      titulo="Crear Usuario"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear"
    />
  );
}
