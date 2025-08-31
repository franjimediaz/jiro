-- CreateTable
CREATE TABLE "Directorios" (
    "id" TEXT NOT NULL,
    "tipo" TEXT,
    "estado" BOOLEAN,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "displayName" TEXT,
    "dni" TEXT,
    "email" TEXT NOT NULL,
    "emailPersonal" TEXT,
    "telefono" TEXT,
    "telefono2" TEXT,
    "fotoUrl" TEXT,
    "puesto" TEXT,
    "departamentoId" TEXT,
    "supervisorId" TEXT,
    "rol" TEXT,
    "jornada" TEXT,
    "turno" TEXT,
    "empresaExternaId" TEXT,
    "usuarioId" TEXT,
    "calendarEmail" TEXT,
    "costeHora" DECIMAL(12,2),
    "tarifaFacturacionHora" DECIMAL(12,2),
    "moneda" TEXT DEFAULT 'EUR',
    "capacidadSemanalHoras" INTEGER,
    "tienePRL" BOOLEAN NOT NULL DEFAULT false,
    "prlVencimiento" TIMESTAMP(3),
    "rcVigente" BOOLEAN NOT NULL DEFAULT false,
    "rcVencimiento" TIMESTAMP(3),
    "ubicacionCiudad" TEXT,
    "ubicacionProvincia" TEXT,
    "ubicacionPais" TEXT,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaBaja" TIMESTAMP(3),
    "observaciones" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Directorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpresaExterna" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cif" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,

    CONSTRAINT "EmpresaExterna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Directorios_dni_key" ON "Directorios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Directorios_email_key" ON "Directorios"("email");

-- CreateIndex
CREATE INDEX "Directorios_tipo_estado_idx" ON "Directorios"("tipo", "estado");

-- CreateIndex
CREATE INDEX "Directorios_departamentoId_idx" ON "Directorios"("departamentoId");

-- CreateIndex
CREATE INDEX "Directorios_empresaExternaId_idx" ON "Directorios"("empresaExternaId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_nombre_key" ON "Departamento"("nombre");

-- AddForeignKey
ALTER TABLE "Directorios" ADD CONSTRAINT "Directorios_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Directorios" ADD CONSTRAINT "Directorios_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Directorios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Directorios" ADD CONSTRAINT "Directorios_empresaExternaId_fkey" FOREIGN KEY ("empresaExternaId") REFERENCES "EmpresaExterna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
