/*
  Warnings:

  - The primary key for the `Directorios` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Directorios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `supervisorId` column on the `Directorios` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "public"."Directorios" DROP CONSTRAINT "Directorios_supervisorId_fkey";

-- AlterTable
ALTER TABLE "public"."Directorios" DROP CONSTRAINT "Directorios_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "supervisorId",
ADD COLUMN     "supervisorId" INTEGER,
ADD CONSTRAINT "Directorios_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."Directorios" ADD CONSTRAINT "Directorios_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "public"."Directorios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
