'use client';
import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import FormularioTabla from '../components/FormularioTabla';

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};
const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', placeholder: 'Introduce tu nombre' },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', placeholder: 'Descripción detallada' },
  {
    nombre: 'estado',
    etiqueta: 'Estado',
    tipo: 'select',
    opciones: [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
    ],
  },
  { nombre: 'aceptado', etiqueta: 'Aceptado', tipo: 'checkbox' },
  { nombre: 'colorFavorito', etiqueta: 'Color favorito', tipo: 'color' },
  { nombre: 'bio', etiqueta: 'Biografía', tipo: 'richtext' },
  { nombre: 'icono', etiqueta: 'Icono representativo', tipo: 'icono' },
  { nombre: 'foto', etiqueta: 'Foto de perfil', tipo: 'archivo' },
  {
    nombre: 'responsable',
    etiqueta: 'Responsable',
    tipo: 'selectorTabla',
    tabla: 'usuarios',
    campoLabel: 'nombre',
    campoValue: 'id',
  },
  { nombre: 'preview', etiqueta: 'Vista previa', tipo: 'previsualizacion' },
  { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' },
  { nombre: 'cita', etiqueta: 'Fecha y hora de cita', tipo: 'datetime-local' },
  { nombre: 'edad', etiqueta: 'Edad', tipo: 'number' },
  { nombre: 'clave', etiqueta: 'Contraseña', tipo: 'password' },
  { nombre: 'etiquetas', etiqueta: 'Etiquetas', tipo: 'tags' },
  {
    nombre: 'genero',
    etiqueta: 'Género',
    tipo: 'radio',
    opciones: [
      { value: 'm', label: 'Masculino' },
      { value: 'f', label: 'Femenino' },
      { value: 'x', label: 'Otro' },
    ],
  },
  { nombre: 'nivelSatisfaccion', etiqueta: 'Satisfacción (%)', tipo: 'slider' },
  { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'stepper' },
  { nombre: 'email', etiqueta: 'Correo electrónico', tipo: 'email' },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
  {
    nombre: 'direcciones',
    etiqueta: 'Direcciones',
    tipo: 'subtabla',
    columnas: [
      { clave: 'via', label: 'Vía' },
      { clave: 'numero', label: 'Número' },
      { clave: 'piso', label: 'Piso' },
      { clave: 'letra', label: 'Letra' },
    ],
  },
  {
  nombre: 'formularioPorPasos',
  etiqueta: 'Registro dividido por pasos',
  tipo: 'pasos',
  pasos: [
    {
      titulo: 'Paso 1: Datos básicos',
      campos: [
        { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text' },
        { nombre: 'email', etiqueta: 'Correo', tipo: 'email' }
      ]
    },
    {
      titulo: 'Paso 2: Dirección',
      campos: [
        { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'text' },
        { nombre: 'ciudad', etiqueta: 'Ciudad', tipo: 'text' }
      ]
    }
  ]
}
];

const valores = {
  nombre: 'Juan Pérez',
  descripcion: 'Descripción corta',
  estado: 'activo',
  aceptado: true,
  colorFavorito: '#4caf50',
  bio: '<p>xxxxxxxxxxxxxxxxxxx</p>',
  icono: 'User',
  foto: '/uploads/foto.jpg',
  responsable: '1',
  preview: '', // se genera visualmente con icono y color
  fechaNacimiento: '1995-05-01',
  cita: '2025-07-10T15:30',
  edad: 29,
  clave: 'secreta',
  etiquetas: ['frontend', 'react'],
  genero: 'm',
  nivelSatisfaccion: 80,
  cantidad: 2,
  email: 'juan@example.com',
  telefono: '666123456',
  direcciones: [
    { via: 'Calle Mayor', numero: '12', piso: '3', letra: 'A' },
    { via: 'Avenida Sur', numero: '5', piso: '1', letra: 'B' },
  ],
};
const eliminarTodo = () => {
  if (confirm("¿Estás seguro de que quieres borrar TODOS los datos?")) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/eliminar-todo`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(data => {
        alert(data.mensaje || 'Todo eliminado');
        location.reload(); // Opcional: recarga la vista
      })
      .catch(err => {
        console.error(err);
        alert('❌ Error al eliminar todo');
      });
  }
};


const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ThemeImage
          className={styles.logo}
          srcLight="turborepo-dark.svg"
          srcDark="turborepo-light.svg"
          alt="Turborepo logo"
          width={180}
          height={38}
          priority
        />
        <ol>
           <FormularioTabla
              titulo={'Campos'}
              campos={campos}
              valores={valores}
              onChange={undefined}
              onSubmit={undefined}
              botonTexto="Guardar cambios"
              soloLectura={false}
            />
          <li>
            Get started by editing <code>apps/docs/app/page.tsx</code>
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new/clone?demo-description=Learn+to+implement+a+monorepo+with+a+two+Next.js+sites+that+has+installed+three+local+packages.&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4K8ZISWAzJ8X1504ca0zmC%2F0b21a1c6246add355e55816278ef54bc%2FBasic.png&demo-title=Monorepo+with+Turborepo&demo-url=https%3A%2F%2Fexamples-basic-web.vercel.sh%2F&from=templates&project-name=Monorepo+with+Turborepo&repository-name=monorepo-turborepo&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fturborepo%2Ftree%2Fmain%2Fexamples%2Fbasic&root-directory=apps%2Fdocs&skippable-integrations=1&teamSlug=vercel&utm_source=create-turbo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://turborepo.com/docs?utm_source"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
        <Button appName="docs" className={styles.secondary}>
          Open alert
        </Button>
        <button onClick={eliminarTodo} style={{ backgroundColor: 'red', color: 'white' }}>
          🗑️ Eliminar todos los datos
        </button>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://turborepo.com?utm_source=create-turbo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to turborepo.com →
        </a>
      </footer>
    </div>
  );
}
