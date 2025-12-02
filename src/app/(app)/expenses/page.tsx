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
import {
  formatCurrency,
  formatDateTime,
  getStartOfToday,
  getStartOfWeek,
  getStartOfMonth,
} from "@/lib/helpers";
import {
  Plus,
  CreditCard,
  Trash2,
  Loader2,
  Calendar,
  Wallet,
} from "lucide-react";
import { Expense } from "@/lib/types";

type DateFilter = "today" | "week" | "month" | "all";

export default function ExpensesPage() {
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  const deleteExpenseMutation = useDeleteExpense();

  const getDateRange = () => {
    switch (dateFilter) {
      case "today":
        return { startDate: getStartOfToday().toISOString() };
      case "week":
        return { startDate: getStartOfWeek().toISOString() };
      case "month":
        return { startDate: getStartOfMonth().toISOString() };
      default:
        return {};
    }
  };

  const { data: expenses, isLoading, error } = useExpenses(getDateRange());

  const dateFilterLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  // Calculate totals
  const totalAmount = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const expenseCount = expenses?.length || 0;

  // Group expenses by payment mode for summary
  const expensesByMode = expenses?.reduce(
    (acc, expense) => {
      acc[expense.paymentMode] = (acc[expense.paymentMode] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

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

        <Sheet open={isAddingOpen} onOpenChange={setIsAddingOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle>Record New Expense</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Enter the expense details below
              </p>
            </SheetHeader>
            <div className="px-6 pb-6">
              <ExpenseForm
                onSuccess={() => setIsAddingOpen(false)}
                onCancel={() => setIsAddingOpen(false)}
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
              <span className="text-sm">{dateFilterLabel[dateFilter]} Expenses</span>
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
            <p className="text-2xl font-bold">{Object.keys(expensesByMode).length}</p>
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
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <ExpenseListSkeleton />
      ) : expenses && expenses.length > 0 ? (
        <div className="space-y-3">
          {expenses.map((expense) => (
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setExpenseToDelete(expense)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
            {dateFilter === "all"
              ? "Record your first expense to get started"
              : `No expenses recorded for ${dateFilterLabel[dateFilter].toLowerCase()}`}
          </p>
          <Button onClick={() => setIsAddingOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense record? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setExpenseToDelete(null)}
              disabled={deleteExpenseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExpense}
              disabled={deleteExpenseMutation.isPending}
            >
              {deleteExpenseMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
