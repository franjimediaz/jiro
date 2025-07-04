/*
  Warnings:

  - A unique constraint covering the columns `[tareaId]` on the table `Servicios_Tarea` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Servicios_Tarea_tareaId_key" ON "Servicios_Tarea"("tareaId");
