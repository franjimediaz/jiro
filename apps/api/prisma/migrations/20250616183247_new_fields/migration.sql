-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "dni" TEXT;

-- AlterTable
ALTER TABLE "Materiales" ADD COLUMN     "stockActual" INTEGER,
ADD COLUMN     "unidadMedida" TEXT;

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "descripcion" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'operario';
