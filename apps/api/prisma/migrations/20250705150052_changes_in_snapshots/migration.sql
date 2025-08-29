/*
  Warnings:

  - You are about to drop the column `cantidad` on the `Presupuesto_Material` table. All the data in the column will be lost.
  - You are about to drop the column `precioUnidad` on the `Presupuesto_Material` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Presupuesto_Material` table. All the data in the column will be lost.
  - You are about to drop the column `orden` on the `Presupuesto_Servicio` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `Presupuesto_Tarea` table. All the data in the column will be lost.
  - You are about to drop the column `precioManoObra` on the `Presupuesto_Tarea` table. All the data in the column will be lost.
  - You are about to drop the column `precioUnidad` on the `Presupuesto_Tarea` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Presupuesto_Tarea` table. All the data in the column will be lost.
  - You are about to drop the column `unidades` on the `Presupuesto_Tarea` table. All the data in the column will be lost.
  - Added the required column `servicioId` to the `Presupuesto_Servicio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Presupuesto_Tarea` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presupuesto_Material" DROP COLUMN "cantidad",
DROP COLUMN "precioUnidad",
DROP COLUMN "total";

-- AlterTable
ALTER TABLE "Presupuesto_Servicio" DROP COLUMN "orden",
ADD COLUMN     "servicioId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Presupuesto_Tarea" DROP COLUMN "descripcion",
DROP COLUMN "precioManoObra",
DROP COLUMN "precioUnidad",
DROP COLUMN "total",
DROP COLUMN "unidades",
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "tareaId" INTEGER;
