-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "isPersonal" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Expense_isPersonal_idx" ON "Expense"("isPersonal");
