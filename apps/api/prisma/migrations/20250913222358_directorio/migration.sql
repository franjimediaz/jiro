/*
  Warnings:

  - The `usuarioId` column on the `Directorios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[usuarioId]` on the table `Directorios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Directorios" DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Directorios_usuarioId_key" ON "public"."Directorios"("usuarioId");

-- AddForeignKey
ALTER TABLE "public"."Directorios" ADD CONSTRAINT "Directorios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
