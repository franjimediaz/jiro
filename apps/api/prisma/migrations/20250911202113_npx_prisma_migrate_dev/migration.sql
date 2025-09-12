/*
  Warnings:

  - The primary key for the `Rol` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Rol` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `rolId` column on the `Usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "public"."Usuario" DROP CONSTRAINT "Usuario_rolId_fkey";

-- AlterTable
ALTER TABLE "public"."Rol" DROP CONSTRAINT "Rol_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Rol_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Usuario" DROP COLUMN "rolId",
ADD COLUMN     "rolId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "public"."Rol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
