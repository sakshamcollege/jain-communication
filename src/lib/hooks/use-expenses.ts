"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/lib/types";

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
}

// Fetch expenses with filters
async function fetchExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await fetch(`/api/expenses?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch expenses");
  return response.json();
}

// Create expense
async function createExpense(data: CreateExpenseInput): Promise<Expense> {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create expense");
  return response.json();
}

// Update expense
async function updateExpense(data: UpdateExpenseInput): Promise<Expense> {
  const { id, ...updateData } = data;
  const response = await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) throw new Error("Failed to update expense");
  return response.json();
}

// Delete expense
async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete expense");
}

// Hook to get expenses
export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => fetchExpenses(filters),
  });
}

// Hook to create expense
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onMutate: async (newExpense) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["expenses"] });

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueriesData<Expense[]>({ queryKey: ["expenses"] });

      // Optimistically update to the new value
      const optimisticExpense: Expense = {
        id: `temp-${Date.now()}`,
        amount: newExpense.amount,
        paymentMode: newExpense.paymentMode,
        description: newExpense.description,
        createdAt: new Date(),
      };

      queryClient.setQueriesData<Expense[]>({ queryKey: ["expenses"] }, (old) => {
        return old ? [optimisticExpense, ...old] : [optimisticExpense];
      });

      // Return a context object with the snapshotted value
      return { previousExpenses };
    },
    onError: (err, newExpense, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousExpenses) {
        context.previousExpenses.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Hook to update expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Hook to delete expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
