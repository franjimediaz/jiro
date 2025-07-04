-- DropForeignKey
ALTER TABLE "Obra" DROP CONSTRAINT "Obra_estadoId_fkey";

-- DropForeignKey
ALTER TABLE "Tareas" DROP CONSTRAINT "Tareas_estadoId_fkey";

-- AlterTable
ALTER TABLE "Obra" ALTER COLUMN "estadoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ST_Material" ADD COLUMN     "facturable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tareas" ALTER COLUMN "estadoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tareas" ADD CONSTRAINT "Tareas_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
