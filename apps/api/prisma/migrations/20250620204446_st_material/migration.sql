-- CreateTable
CREATE TABLE "ST_Material" (
    "id" SERIAL NOT NULL,
    "ServicioTareaId" INTEGER NOT NULL,
    "materialesId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "preciounidad" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "ST_Material_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ST_Material" ADD CONSTRAINT "ST_Material_materialesId_fkey" FOREIGN KEY ("materialesId") REFERENCES "Materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
