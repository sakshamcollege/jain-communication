import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sale, CreateSaleInput, UpdateSaleInput, SaleWithProduct } from "@/lib/types";

const API_BASE = "/api/sales";

// Fetch all sales
async function fetchSales(params?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  limit?: number;
}): Promise<SaleWithProduct[]> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.productId) searchParams.set("productId", params.productId);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch sales");
  return response.json();
}

// Create sale
async function createSale(data: CreateSaleInput): Promise<Sale> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create sale");
  }
  return response.json();
}

// Update sale
async function updateSale(data: UpdateSaleInput): Promise<SaleWithProduct> {
  const { id, ...updateData } = data;
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update sale");
  }
  return response.json();
}

// Delete sale
async function deleteSale(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete sale");
  }
}

// React Query Hooks
export function useSales(params?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => fetchSales(params),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
