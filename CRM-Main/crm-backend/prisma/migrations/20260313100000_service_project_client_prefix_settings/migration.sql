-- AlterTable
ALTER TABLE "shop_settings"
ADD COLUMN     "project_prefix" TEXT NOT NULL DEFAULT 'PRJ-',
ADD COLUMN     "project_counter" INTEGER NOT NULL DEFAULT 1001,
ADD COLUMN     "client_prefix" TEXT NOT NULL DEFAULT 'CLT-',
ADD COLUMN     "client_counter" INTEGER NOT NULL DEFAULT 1001;

