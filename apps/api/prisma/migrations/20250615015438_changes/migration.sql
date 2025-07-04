/*
  Warnings:

  - You are about to drop the column `descripción` on the `Materiales` table. All the data in the column will be lost.
  - You are about to drop the `_Servicios_TareaToUsuario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `descripcion` to the `Materiales` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_Servicios_TareaToUsuario" DROP CONSTRAINT "_Servicios_TareaToUsuario_A_fkey";

-- DropForeignKey
ALTER TABLE "_Servicios_TareaToUsuario" DROP CONSTRAINT "_Servicios_TareaToUsuario_B_fkey";

-- AlterTable
ALTER TABLE "Materiales" DROP COLUMN "descripción",
ADD COLUMN     "descripcion" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Servicios_Tarea" ADD COLUMN     "total" DOUBLE PRECISION,
ADD COLUMN     "usuarioId" INTEGER,
ALTER COLUMN "precioManoObra" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cantidadMateriales" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "precioMateriales" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "_Servicios_TareaToUsuario";

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
