'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import FormularioTabla from '../../../components/FormularioTabla';
import TablaListado from '../../../components/TablaListado';
import type { Columna } from '../../../components/TablaListado';



type MaterialAsignado = {
  id: number;
  material: {
    nombre: string;
  };
  cantidad: number;
  precioUnidad: number;
  total: number;
  facturable: boolean;
};
const campos = [
  {
    nombre: 'servicioId',
    etiqueta: 'Servicio',
    tipo: 'selectorTabla',
    tabla: 'servicios',
    campoLabel: 'nombre',
    campoValue: 'id',
    multiple: false,
    readOnly: true
    
  },
  {
    nombre: 'obraId',
    etiqueta: 'Obra',
    tipo: 'selectorTabla',
    tabla: 'obras',
    campoLabel: 'nombre',
    campoValue: 'id',
    multiple: false,
    readOnly: true
  },
  {
    nombre: 'clienteId',
    etiqueta: 'Cliente',
    tipo: 'selectorTabla',
    tabla: 'clientes',
    campoLabel: 'nombre',
    campoValue: 'id',
    multiple: false,
    readOnly: true
  },
  { nombre: 'nombre', etiqueta: 'Nombre de la Tarea' },
  { nombre: 'descripcion', etiqueta: 'Descripción' },
  { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'Fecha de fin', tipo: 'date' },
  

  { nombre: 'estadoId',
    etiqueta: 'Estado',
    tipo: 'selectorTabla',
    tabla: 'estados',
    campoLabel: 'nombre',
    campoValue: 'id',},

  { nombre: 'progreso', etiqueta: 'Progreso', tipo: 'slider' },

  { nombre: 'precioManoObra', etiqueta: 'Mano de Obra' },
  { nombre: 'cantidadMateriales', etiqueta: 'Cantidad' },
  { nombre: 'precioMateriales', etiqueta: 'Precio materiales',tipo: 'readonly'  },
  { nombre: 'total', etiqueta: 'Total', tipo: 'readonly' }
];

export default function NuevaTarea() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicioTareaIdParam = searchParams.get('servicioTareaId');
  const obraIdParam = searchParams.get('obraId');
  const servicioIdParam = searchParams.get('servicioId');
  const esEdicion = Boolean(servicioTareaIdParam);
  const { id } = useParams();
const columnas: Columna[] = [
  { clave: 'material.nombre', encabezado: 'Material', tipo: 'texto' },
  { clave: 'cantidad', encabezado: 'Cantidad', tipo: 'texto' },
  { clave: 'preciounidad', encabezado: '€/Ud', tipo: 'texto' },
  { clave: 'total', encabezado: 'Total €', tipo: 'texto' },
  { clave: 'facturable', encabezado: 'Facturable', tipo: 'checkbox' },
];

  const [valores, setValores] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    estadoId:'',
    progreso:'',
    fechaInicio: '',
    tareaId:'',
    fechaFin: '',
    servicioId: servicioIdParam ? Number(servicioIdParam) : '',
    obraId: obraIdParam ? Number(obraIdParam) : '',
    clienteId: '',
    precioManoObra: '',
    cantidadMateriales: '',
    precioMateriales: '',
    total: ''
  });
  const [materiales, setMateriales] = useState<MaterialAsignado[]>([]);
const irAMateriales = () => {
    router.push(`/materiales/STMaterial?servicioTareaId=${servicioTareaIdParam}`);
  };


  ///////////
  useEffect(() => {
    const manoObra = parseFloat(valores.precioManoObra as string) || 0;
    const cantidad = parseFloat(valores.cantidadMateriales as string) || 0;
    const precioMaterial = parseFloat(valores.precioMateriales as string) || 0;
    const total = manoObra * cantidad + precioMaterial;
    setValores((prev) => ({ ...prev, total: total.toFixed(2) }));
  }, [valores.precioManoObra, valores.cantidadMateriales, valores.precioMateriales]);



  useEffect(() => {
    if (obraIdParam && !valores.clienteId) {
      const cargarObra = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${obraIdParam}`);
          const obra = await res.json();
          setValores((prev) => ({
            ...prev,
            obraId: Number(obraIdParam),
            servicioId: servicioIdParam ? Number(servicioIdParam) : '',
            clienteId: obra.clienteId || ''
          }));
        } catch (error) {
          console.error('Error cargando obra para obtener clienteId:', error);
        }
      };
      cargarObra();
    }
  }, [obraIdParam, servicioIdParam, valores.clienteId]);



  useEffect(() => {
    if (!servicioTareaIdParam) return;

    const cargarTarea = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaIdParam}`);
        const data = await res.json();

        if (!data.tarea) {
            console.warn('No hay tarea asociada, creando nueva tarea...');

            // 1. Crear nueva tarea vacía (puedes pasar solo nombre o campos básicos)
            const nuevaTareaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nombre: 'Nueva tarea',
                descripcion: '',
                estadoId: valores.estadoId,
                
                
              })
            });

            if (!nuevaTareaRes.ok) {
              throw new Error('Error al crear nueva tarea');
            }

            const nuevaTarea = await nuevaTareaRes.json();

            // 2. Asociar el id de la nueva tarea al servicio_tarea
            const patchRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaIdParam}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tareaId: nuevaTarea.id })
            });

            if (!patchRes.ok) {
              throw new Error('Error al asociar tarea recién creada');
            }

            // 3. Volver a cargar el registro ya con la tarea
            return cargarTarea(); // Llama de nuevo recursivamente
          }


        setValores((prev) => ({
          ...prev,
          id: data.tarea.id || '',
          nombre: data.tarea.nombre || '',
          descripcion: data.tarea.descripcion || '',
          estadoId: data.tarea.estado || '',
          servicioId: data.servicioId || '',
          obraId: data.obraId || '',
          progreso: data.progreso || '',
          fechaInicio: data.fechaInicio?.substring(0, 10) || '',
          fechaFin: data.fechaFin?.substring(0, 10) || '',
          precioManoObra: data.precioManoObra?.toString() || '',
          cantidadMateriales: data.cantidadMateriales?.toString() || '',
          precioMateriales: data.precioMateriales?.toString() || '',
          total: data.total?.toFixed(2) || '0.00',
          clienteId: data.obra?.clienteId || ''
        }));
      } catch (err) {
        console.error('Error al cargar datos desde servicio_tarea:', err);
      }
    };

    cargarTarea();
  }, [servicioTareaIdParam]);
useEffect(() => {
  if (!servicioTareaIdParam) return;

  const cargarMateriales = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/st_material/por-servicio/${servicioTareaIdParam}`);
      if (!res.ok) throw new Error('Error al cargar materiales');
      console.log('🧪 servicioTareaIdParam:', servicioTareaIdParam);
      const data = await res.json();
      console.log('🧪 Materiales cargados:', data); // <--- AQUI
      setMateriales(data);
    } catch (err) {
      console.error('❌ Error cargando materiales:', err);
    }
  };

  cargarMateriales();
}, [servicioTareaIdParam]);

useEffect(() => {
  // Filtramos materiales facturables
  const materialesFacturables = materiales.filter((m) => m.facturable);

  // Sumamos el total de cada uno
  const totalMateriales = materialesFacturables.reduce((acc, m) => acc + (m.total || 0), 0);

  // Actualizamos el campo precioMateriales automáticamente
  setValores((prev) => ({
    ...prev,
    precioMateriales: totalMateriales.toFixed(2),
  }));
}, [materiales]);



  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };
  const bodyUpdateST = {
          tareaId: Number(valores.id),
          obraId: Number(valores.obraId),
          servicioId: Number(valores.servicioId),
          fechaInicio: valores.fechaInicio,
          fechaFin: valores.fechaFin,
          estado: Number(valores.estadoId),
          precioManoObra: parseFloat(valores.precioManoObra) || 0,
          cantidadMateriales: parseFloat(valores.cantidadMateriales) || 0,
          precioMateriales: parseFloat(valores.precioMateriales) || 0,
          total: parseFloat(valores.total) || 0
        };

  const handleSubmit = async () => {
    try {
      let tareaId = null;
      console.log(valores)
      if (esEdicion) {
        const resUpdateTarea = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tareas/${valores.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            estadoId: Number(valores.estadoId),
            progreso: Number(valores.progreso),
          })
        });
        if (!resUpdateTarea.ok) throw new Error('Error actualizando tarea');
        const tareaActualizada = await resUpdateTarea.json();
        tareaId = tareaActualizada.id;
        console.log(bodyUpdateST)
        console.log(tareaId)

        const resUpdateST = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea/${servicioTareaIdParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyUpdateST) // ✅ CORREGIDO
        });
        if (!resUpdateST.ok) throw new Error('Error actualizando vinculación servicio');
        alert('Tarea actualizada correctamente');
      } else {
        const resTarea = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            estadoId: Number(valores.estadoId),
            progreso: Number(valores.progreso),
          })
        });
        if (!resTarea.ok) throw new Error('Error al crear tarea');
        const tareaCreada = await resTarea.json();
        tareaId = tareaCreada.id;
        const bodyUpdateST = {
          tareaId: Number(tareaId),
          obraId: Number(valores.obraId),
          servicioId: Number(valores.servicioId),
          fechaInicio: valores.fechaInicio,
          fechaFin: valores.fechaFin,
          precioManoObra: parseFloat(valores.precioManoObra) || 0,
          cantidadMateriales: parseFloat(valores.cantidadMateriales) || 0,
          precioMateriales: parseFloat(valores.precioMateriales) || 0,
          total: parseFloat(valores.total) || 0
        };
        console.log(bodyUpdateST)

        const resST = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyUpdateST) 
        });
        if (!resST.ok) throw new Error('Error al vincular servicio con tarea');
        alert('Tarea creada correctamente');
      }

      router.push(`/obras`);
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error al guardar la tarea:', error.message);
      } else {
        console.error('❌ Error desconocido al guardar la tarea:', error);
      }
      alert('❌ Hubo un problema al guardar la tarea. Revisa la consola para más detalles.');
          }
  };
  const handleEliminar = async (id: number) => {
  const confirmar = confirm('¿Seguro que deseas eliminar este material?');
  if (!confirmar) return;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/st_material/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar');

    // Recargar materiales tras eliminar
    setMateriales((prev) => prev.filter((m) => m.id !== id));
  } catch (err) {
    console.error('❌ Error al eliminar material:', err);
  }
};


  return (

    <div className="contenedor-formulario">
    <FormularioTabla
      titulo={esEdicion ? 'Editar Tarea' : 'Crear Tarea'}
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto={esEdicion ? 'Actualizar Tarea' : 'Crear Tarea'}
    />
    <div className="alineado-boton">
     <button onClick={irAMateriales} className="boton-flotante"> Asignar Material </button>
     </div>
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={materiales}
            onVer={(material) => router.push(`/materiales/STMaterial/${material.id}`)}
            onEditar={(material) => router.push(`/materiales/STMaterial/${material.id}?edit=true`)}
            onEliminar={(material) => handleEliminar(material.id)}

          />
          <div style={{ marginTop: '10px', textAlign: 'right', fontWeight: 'bold' }}>
            Total materiales facturables: {valores.precioMateriales} €
          </div>
     </div>

      
  );
}
