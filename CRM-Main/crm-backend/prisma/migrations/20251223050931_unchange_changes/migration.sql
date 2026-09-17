/*
  Warnings:

  - You are about to drop the column `base_unit_id` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `cost_per_base_unit` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `cost_amount` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `profit_amount` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `allow_loose_sales` on the `shop_settings` table. All the data in the column will be lost.
  - You are about to drop the column `allow_multi_unit_sales` on the `shop_settings` table. All the data in the column will be lost.
  - You are about to drop the `item_unit_prices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."inventory_items" DROP CONSTRAINT "inventory_items_base_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_unit_prices" DROP CONSTRAINT "item_unit_prices_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_unit_prices" DROP CONSTRAINT "item_unit_prices_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_unit_prices" DROP CONSTRAINT "item_unit_prices_unitId_fkey";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "base_unit_id",
DROP COLUMN "cost_per_base_unit";

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "cost_amount",
DROP COLUMN "profit_amount";

-- AlterTable
ALTER TABLE "shop_settings" DROP COLUMN "allow_loose_sales",
DROP COLUMN "allow_multi_unit_sales";

-- DropTable
DROP TABLE "public"."item_unit_prices";
