"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateRechargeInput } from "@/lib/types";

export interface Recharge {
  id: string;
  amount: number;
  profit: number;
  description: string | null;
  createdAt: string;
}

export interface CreateRechargeInput {
  amount: number;
  description?: string;
}

interface RechargeFilters {
  startDate?: string;
  endDate?: string;
}

// Fetch recharges with filters
async function fetchRecharges(filters: RechargeFilters = {}): Promise<Recharge[]> {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await fetch(`/api/recharges?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch recharges");
  return response.json();
}

// Create recharge
async function createRecharge(data: CreateRechargeInput): Promise<Recharge> {
  const response = await fetch("/api/recharges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create recharge");
  return response.json();
}

// Update recharge
async function updateRecharge(data: UpdateRechargeInput): Promise<Recharge> {
  const { id, ...updateData } = data;
  const response = await fetch(`/api/recharges/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) throw new Error("Failed to update recharge");
  return response.json();
}

// Delete recharge
async function deleteRecharge(id: string): Promise<void> {
  const response = await fetch(`/api/recharges/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete recharge");
}

// Hook to get recharges
export function useRecharges(filters: RechargeFilters = {}) {
  return useQuery({
    queryKey: ["recharges", filters],
    queryFn: () => fetchRecharges(filters),
  });
}

// Hook to create recharge
export function useCreateRecharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharges"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Hook to update recharge
export function useUpdateRecharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharges"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Hook to delete recharge
export function useDeleteRecharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharges"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
