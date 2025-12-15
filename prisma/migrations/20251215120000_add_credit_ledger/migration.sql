-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('CUSTOMER', 'VENDOR');

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('CHARGE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "CreditSourceType" AS ENUM ('RECHARGE', 'EXPENSE', 'MANUAL');

-- AlterTable
ALTER TABLE "Recharge" ADD COLUMN     "isCredit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partyId" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "isCredit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partyId" TEXT;

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "type" "PartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "source" "CreditSourceType" NOT NULL,
    "sourceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Party_type_normalizedName_key" ON "Party"("type", "normalizedName");

-- CreateIndex
CREATE INDEX "Party_type_idx" ON "Party"("type");

-- CreateIndex
CREATE INDEX "Party_name_idx" ON "Party"("name");

-- CreateIndex
CREATE INDEX "CreditTransaction_partyId_createdAt_idx" ON "CreditTransaction"("partyId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_source_sourceId_idx" ON "CreditTransaction"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_source_sourceId_type_key" ON "CreditTransaction"("source", "sourceId", "type");

-- CreateIndex
CREATE INDEX "Recharge_isCredit_idx" ON "Recharge"("isCredit");

-- CreateIndex
CREATE INDEX "Recharge_partyId_idx" ON "Recharge"("partyId");

-- CreateIndex
CREATE INDEX "Expense_isCredit_idx" ON "Expense"("isCredit");

-- CreateIndex
CREATE INDEX "Expense_partyId_idx" ON "Expense"("partyId");

-- AddForeignKey
ALTER TABLE "Recharge" ADD CONSTRAINT "Recharge_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
