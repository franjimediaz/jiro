-- DropForeignKey
ALTER TABLE "Servicios_Tarea" DROP CONSTRAINT "Servicios_Tarea_materialesId_fkey";

-- DropForeignKey
ALTER TABLE "Servicios_Tarea" DROP CONSTRAINT "Servicios_Tarea_tareaId_fkey";

-- AlterTable
ALTER TABLE "Servicios_Tarea" ALTER COLUMN "tareaId" DROP NOT NULL,
ALTER COLUMN "materialesId" DROP NOT NULL,
ALTER COLUMN "fechaInicio" DROP NOT NULL,
ALTER COLUMN "fechaFin" DROP NOT NULL,
ALTER COLUMN "precioManoObra" DROP NOT NULL,
ALTER COLUMN "cantidadMateriales" DROP NOT NULL,
ALTER COLUMN "precioMateriales" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_materialesId_fkey" FOREIGN KEY ("materialesId") REFERENCES "Materiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
