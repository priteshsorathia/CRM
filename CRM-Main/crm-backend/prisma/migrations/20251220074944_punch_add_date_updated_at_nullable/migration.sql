/*
  Warnings:

  - You are about to drop the column `timestamp` on the `punches` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `punches` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,date]` on the table `punches` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "punches" DROP COLUMN "timestamp",
DROP COLUMN "type",
ADD COLUMN     "check_in" TIMESTAMP(3),
ADD COLUMN     "check_out" TIMESTAMP(3),
ADD COLUMN     "date" DATE,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "punches_employeeId_date_key" ON "punches"("employeeId", "date");
