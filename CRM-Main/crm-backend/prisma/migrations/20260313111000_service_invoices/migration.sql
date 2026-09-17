-- CreateTable
CREATE TABLE "service_invoices" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clientId" INTEGER,
    "projectId" INTEGER,
    "clientName" TEXT,
    "projectName" TEXT,
    "issuedDate" DATE NOT NULL,
    "dueDate" DATE,
    "terms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "items" JSONB,
    "payments" JSONB,
    "shopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_invoices_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "shop_settings"
ADD COLUMN     "service_invoice_prefix" TEXT NOT NULL DEFAULT 'INV-',
ADD COLUMN     "service_invoice_counter" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "service_invoices_shopId_idx" ON "service_invoices"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "service_invoices_shopId_invoiceId_key" ON "service_invoices"("shopId", "invoiceId");

-- AddForeignKey
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "service_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "service_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

