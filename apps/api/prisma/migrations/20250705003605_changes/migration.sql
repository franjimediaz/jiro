-- AddForeignKey
ALTER TABLE "ST_Material" ADD CONSTRAINT "ST_Material_ServicioTareaId_fkey" FOREIGN KEY ("ServicioTareaId") REFERENCES "Servicios_Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
