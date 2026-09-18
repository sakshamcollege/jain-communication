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
import { useExpenses, useDeleteExpense } from "@/lib/hooks";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseListSkeleton } from "@/components/Skeletons";
import { EditButton, DeleteButton } from "@/components/ui/action-buttons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DateRangePicker, type DateRangeInput } from "@/components/DateRangePicker";
import {
  formatCurrency,
  formatDateInput,
  formatDateTime,
  getDateRangeFromInputs,
  getDateRangeLabel,
  getStartOfToday,
} from "@/lib/helpers";
import {
  Plus,
  CreditCard,
  Wallet,
  User,
} from "lucide-react";
import { Expense, PaymentMode, PAYMENT_MODES } from "@/lib/types";

type ExpenseTypeFilter = "all" | "shop" | "personal";

export default function ExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeInput>(() => {
    const today = formatDateInput(getStartOfToday());
    return { from: today, to: today };
  });
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>("all");

  const deleteExpenseMutation = useDeleteExpense();

  const filters = {
    ...getDateRangeFromInputs(dateRange),
    ...(paymentModeFilter !== "all" ? { paymentMode: paymentModeFilter } : {}),
  };

  const { data: expenses, isLoading, error } = useExpenses(filters);

  const datedExpenses = expenses || [];
  const shopExpenses = datedExpenses.filter((e) => !e.isPersonal);
  const personalExpenses = datedExpenses.filter((e) => e.isPersonal);
  const filteredExpenses =
    typeFilter === "shop"
      ? shopExpenses
      : typeFilter === "personal"
        ? personalExpenses
        : datedExpenses;

  // Calculate totals
  const shopTotal = shopExpenses.reduce((sum, e) => sum + e.amount, 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + e.amount, 0);

  const rangeLabel = getDateRangeLabel(dateRange);

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
            Track shop expenses and your personal spending
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
              <span className="text-sm">Shop</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(shopTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {shopExpenses.length} entries · {rangeLabel}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <User className="h-4 w-4" />
              <span className="text-sm">Personal</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(personalTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {personalExpenses.length} entries · {rangeLabel}
            </p>
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

      {/* Date Range */}
      <div className="flex items-center gap-4">
        <DateRangePicker value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "all", label: "All" },
          { id: "shop", label: "Shop" },
          { id: "personal", label: "Personal" },
        ] as const).map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={typeFilter === option.id ? "default" : "outline"}
            onClick={() => setTypeFilter(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Payment Mode Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={paymentModeFilter === "all" ? "default" : "outline"}
          onClick={() => setPaymentModeFilter("all")}
        >
          All modes
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
                    <div
                      className={`p-2 rounded-full ${
                        expense.isPersonal
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "bg-red-100 dark:bg-red-900"
                      }`}
                    >
                      {expense.isPersonal ? (
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-red-600 dark:text-red-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant={expense.isPersonal ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {expense.isPersonal ? "Personal" : "Shop"}
                        </Badge>
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
                      <p
                        className={`font-semibold ${
                          expense.isPersonal ? "text-blue-600" : "text-red-600"
                        }`}
                      >
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
            {typeFilter !== "all"
              ? `No ${typeFilter} expenses for ${rangeLabel.toLowerCase()}`
              : paymentModeFilter === "all"
                ? !dateRange.from && !dateRange.to
                  ? "Record your first expense to get started"
                  : `No expenses recorded for ${rangeLabel.toLowerCase()}`
                : `No ${paymentModeFilter.toLowerCase()} expenses for ${rangeLabel.toLowerCase()}`}
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
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">
                {expenseToDelete.isPersonal ? "Personal" : "Shop"}
              </span>
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
