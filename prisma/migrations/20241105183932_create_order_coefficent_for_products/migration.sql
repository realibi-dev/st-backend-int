/*
  Warnings:

  - Added the required column `orderId` to the `ProductReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "orderCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "orderId" INTEGER NOT NULL,
ALTER COLUMN "comment" SET DEFAULT '';
