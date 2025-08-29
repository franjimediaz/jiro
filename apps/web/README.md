This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


¿Dónde se va a mostrar el botón? (por ejemplo: en la vista de detalle del presupuesto, en la lista de presupuestos, etc.)

    Se va a mostrar en la vista de presupuestos, concretamente en: obras/presupuestos/[id]

¿Qué debe hacer exactamente al pulsarlo? (¿crear una nueva factura en base al presupuesto?, ¿abrir un formulario?, ¿generar PDF?, etc.)

    Debera abrir un formulario que tenga los parametros %/€ o servicios para poder hacer facturas por porcentaje de obra, por cantidad o por servicios que queramos facturar.

¿Qué datos necesita? (¿id del presupuesto?, ¿cliente?, ¿importe?, ¿servicios concretos?, etc.)

    Almacenara los campos que tenemos descritos en db: 

    model Facturas {
    id             Int               @id @default(autoincrement())
    referencia      String
    fecha           DateTime
    cobrada         Boolean @default(false)
    cantidad        Int?
    servicio   Presupuesto_Servicio[]
    presupuestoId Int
    Presupuesto       Presupuesto? @relation(fields: [presupuestoId], references: [id])
    }

    la cantidad se calculara en base a lo que hemos descrito en el formulario, si seleccionamos los servicios debera calcularlo en base del precio total del servicio a facturar 

¿Cómo se comporta si ya existe una factura vinculada?

    Debera poder crearse varias facturas vinculadas a un unico presupuesto

¿La generación será automática o se editarán datos antes de guardar?
    La generación sera automatica, la factura se tendra que crear en base a los datos que tiene almacenados y vinculados en presupuesto 

¿La factura se guarda en una tabla Facturas en la base de datos o simplemente se genera para descarga?

Se guarda en esta tabla:
model Facturas {
  id             Int               @id @default(autoincrement())
  referencia      String
  fecha           DateTime
  cobrada         Boolean @default(false)
  cantidad        Int?
  servicio   Presupuesto_Servicio[]
  presupuestoId Int
  Presupuesto       Presupuesto? @relation(fields: [presupuestoId], references: [id])
}

Debera tener la opción de poder generar un pdf de la factura que detallaremos como tiene que ser mas adelante

¿Quieres generar PDF también desde ese botón?

No, el boton que genera el pdf tiene que estar en la vista de la factura, estara en obras/presupuestos/facturas

¿Debe redirigir a una nueva ruta (como /facturas/[id]) tras generarla?

si tiene que redirigir a la factura tras generarla 
