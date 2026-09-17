/*
  Warnings:

  - Added the required column `base_unit_id` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cost_per_base_unit` to the `inventory_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "base_unit_id" INTEGER NOT NULL,
ADD COLUMN     "cost_per_base_unit" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "cost_amount" DOUBLE PRECISION,
ADD COLUMN     "profit_amount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "shop_settings" ADD COLUMN     "allow_loose_sales" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_multi_unit_sales" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "item_unit_prices" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "selling_price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_unit_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_unit_prices_itemId_unitId_shopId_key" ON "item_unit_prices"("itemId", "unitId", "shopId");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_unit_prices" ADD CONSTRAINT "item_unit_prices_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_unit_prices" ADD CONSTRAINT "item_unit_prices_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_unit_prices" ADD CONSTRAINT "item_unit_prices_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
