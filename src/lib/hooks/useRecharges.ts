"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Recharge {
  id: string;
  mobileNumber: string;
  amount: number;
  type: string;
  operator: string | null;
  profit: number;
  createdAt: string;
}

export interface CreateRechargeInput {
  mobileNumber: string;
  amount: number;
  type: string;
  operator?: string;
}

interface RechargeFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Fetch recharges with filters
async function fetchRecharges(filters: RechargeFilters = {}): Promise<Recharge[]> {
  const params = new URLSearchParams();
  
  if (filters.type) params.append("type", filters.type);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.search) params.append("search", filters.search);

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
