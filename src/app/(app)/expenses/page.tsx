"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useExpenses, useDeleteExpense } from "@/lib/hooks";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseListSkeleton } from "@/components/Skeletons";
import { EditButton, DeleteButton } from "@/components/ui/action-buttons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import {
  DateFilterSelect,
  DateFilter,
  dateFilterLabels,
  getDateRangeFromFilter,
} from "@/components/DateFilter";
import {
  formatCurrency,
  formatDateTime,
} from "@/lib/helpers";
import {
  Plus,
  CreditCard,
  Wallet,
} from "lucide-react";
import { Expense, PaymentMode, PAYMENT_MODES } from "@/lib/types";

export default function ExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | "all">("all");

  const deleteExpenseMutation = useDeleteExpense();

  const filters = {
    ...getDateRangeFromFilter(dateFilter),
    ...(paymentModeFilter !== "all" ? { paymentMode: paymentModeFilter } : {}),
  };

  const { data: expenses, isLoading, error } = useExpenses(filters);

  const filteredExpenses = expenses || [];

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = filteredExpenses.length;
  const paymentModesUsed = new Set(filteredExpenses.map((e) => e.paymentMode)).size;

  // Group expenses by payment mode for summary
  const expensesByMode = filteredExpenses.reduce(
    (acc, expense) => {
      acc[expense.paymentMode] = (acc[expense.paymentMode] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleOpenSheet = (expense?: Expense) => {
    setExpenseToEdit(expense || null);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setExpenseToEdit(null);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteExpenseMutation.mutateAsync(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load expenses</h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your daily expenses
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => handleOpenSheet()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle>
                {expenseToEdit ? "Edit Expense" : "Record New Expense"}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {expenseToEdit
                  ? "Update the expense details below"
                  : "Enter the expense details below"}
              </p>
            </SheetHeader>
            <div className="px-6 pb-6">
              <ExpenseForm
                key={expenseToEdit?.id || "new"}
                editExpense={expenseToEdit}
                onSuccess={handleCloseSheet}
                onCancel={handleCloseSheet}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">{dateFilterLabels[dateFilter]} Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">{expenseCount} entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Payment Modes</span>
            </div>
            <p className="text-2xl font-bold">{paymentModesUsed}</p>
            <p className="text-xs text-muted-foreground">modes used</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense by Payment Mode Breakdown */}
      {Object.keys(expensesByMode).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Breakdown by Payment Mode
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(expensesByMode).map(([mode, amount]) => (
                <div
                  key={mode}
                  className="p-3 bg-muted/50 rounded-lg border"
                >
                  <p className="text-xs text-muted-foreground truncate">{mode}</p>
                  <p className="font-semibold text-red-600">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <DateFilterSelect value={dateFilter} onValueChange={setDateFilter} />
      </div>

      {/* Payment Mode Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={paymentModeFilter === "all" ? "default" : "outline"}
          onClick={() => setPaymentModeFilter("all")}
        >
          All
        </Button>
        {PAYMENT_MODES.map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={paymentModeFilter === mode ? "default" : "outline"}
            onClick={() => setPaymentModeFilter(mode)}
          >
            {mode}
          </Button>
        ))}
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <ExpenseListSkeleton />
      ) : expenses && filteredExpenses.length > 0 ? (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                      <CreditCard className="w-4 h-4 text-red-600 dark:text-red-300" />
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {expense.paymentMode}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-semibold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <EditButton onClick={() => handleOpenSheet(expense)} />
                    <DeleteButton onClick={() => setExpenseToDelete(expense)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
          <p className="text-muted-foreground mb-4">
            {paymentModeFilter === "all"
              ? dateFilter === "all"
                ? "Record your first expense to get started"
                : `No expenses recorded for ${dateFilterLabels[dateFilter].toLowerCase()}`
              : `No ${paymentModeFilter.toLowerCase()} expenses for ${dateFilterLabels[dateFilter].toLowerCase()}`}
          </p>
          <Button onClick={() => handleOpenSheet()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        title="Delete Expense"
        description="Are you sure you want to delete this expense record? This action cannot be undone."
        onConfirm={handleDeleteExpense}
        isDeleting={deleteExpenseMutation.isPending}
      >
        {expenseToDelete && (
          <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2 border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium">{expenseToDelete.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Mode:</span>
              <span className="font-medium">{expenseToDelete.paymentMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(expenseToDelete.amount)}
              </span>
            </div>
          </div>
        )}
      </DeleteConfirmationDialog>
    </div>
  );
}
