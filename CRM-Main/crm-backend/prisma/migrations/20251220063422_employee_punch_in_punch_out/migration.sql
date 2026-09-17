-- CreateTable
CREATE TABLE "punches" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "punches_employeeId_shopId_idx" ON "punches"("employeeId", "shopId");

-- AddForeignKey
ALTER TABLE "punches" ADD CONSTRAINT "punches_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punches" ADD CONSTRAINT "punches_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
