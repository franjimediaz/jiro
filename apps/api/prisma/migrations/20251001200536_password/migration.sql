/*
  Warnings:

  - Made the column `passwordHash` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "passwordHash" SET NOT NULL;
