-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripción" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceptado" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" INTEGER NOT NULL,
    "obraId" INTEGER NOT NULL,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branding" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "CIF" TEXT NOT NULL,
    "dirección" TEXT NOT NULL,

    CONSTRAINT "Branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT,
    "ruta" TEXT,
    "orden" INTEGER,
    "padreId" INTEGER,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
