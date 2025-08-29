'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioTabla from '../../components/FormularioTabla';

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre de la empresa' },
  { nombre: 'CIF', etiqueta: 'CIF' },
  { nombre: 'direccion', etiqueta: 'Dirección fiscal' },
  { nombre: 'codigoPostal', etiqueta: 'CP' },
  { nombre: 'localidad', etiqueta: 'Localidad' },
  { nombre: 'provincia', etiqueta: 'Provincia' },
  { nombre: 'telefono', etiqueta: 'Teléfono' },
  { nombre: 'email', etiqueta: 'Email' },
  { nombre: 'web', etiqueta: 'Web' },
  { nombre: 'logoUrl', etiqueta: 'Logo', tipo:'archivo', documento: true },
  { nombre: 'colorGeneral', etiqueta: 'Color General', tipo:'color' },
  { nombre: 'colorPDF', etiqueta: 'Color PDF', tipo:'color' },
  { nombre: 'CondicionesPresupuesto', etiqueta: 'Condiciones Presupuestos', tipo: 'richtext' },
  { nombre: 'firma', etiqueta: 'Firma' ,tipo:'archivo', documento: true},
];

export default function BrandingPage() {
  const router = useRouter();
  const [valores, setValores] = useState({
  id:'',
  nombre: '',
  CIF: '',
  direccion: '',
  codigoPostal: '',
  localidad: '',
  provincia: '',
  telefono: '',
  email: '',
  web: '',
  logoUrl: '',
  CondicionesPresupuesto:'',
  firma:'',
});


  const [brandingId, setBrandingId] = useState<number | null>(null);

  useEffect(() => {
    // Cargar branding actual si existe
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding`)
      .then(res => res.json())
      .then(data => {
        if (data?.id) {
          setBrandingId(data.id);
          setValores({
            id: data.id,
            nombre: data.nombre || '',
            CIF: data.CIF || '',
            direccion: data.direccion || '',
            codigoPostal: data.codigoPostal || '',
            localidad: data.localidad || '',
            provincia: data.provincia || '',
            telefono: data.telefono || '',
            email: data.email || '',
            web: data.web || '',
            logoUrl: data.logoUrl || '',
            CondicionesPresupuesto: data.CondicionesPresupuesto || '',
            firma:data.firma || '',
          });

        }
      })
      .catch(err => console.error('Error al cargar branding:', err));
  }, []);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const url = brandingId
      ? `${process.env.NEXT_PUBLIC_API_URL}/branding/${brandingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/branding`;

    const method = brandingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert('Branding guardado correctamente');
      router.refresh(); // recarga si estás en la misma página
    } else {
      alert('Error al guardar branding');
    }
  };

  return (
    <FormularioTabla
      titulo="Configuración de empresa"
      campos={campos}
      valores={valores}
      registroId={Number(valores.id)}
      tabla="branding"
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto={brandingId ? 'Actualizar' : 'Guardar'}
    />
  );
}
