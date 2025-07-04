/*
  Warnings:

  - You are about to drop the column `clienteID` on the `Obra` table. All the data in the column will be lost.
  - Added the required column `clienteId` to the `Obra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Obra" DROP COLUMN "clienteID",
ADD COLUMN     "clienteId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
