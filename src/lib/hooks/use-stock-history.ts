import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockMovementWithProduct } from "@/lib/types";

const API_BASE = "/api/stock-history";

// Fetch stock movements
async function fetchStockHistory(params?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  type?: string;
  limit?: number;
}): Promise<StockMovementWithProduct[]> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.productId) searchParams.set("productId", params.productId);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch stock history");
  return response.json();
}

// Adjust stock
async function adjustStock(data: {
  productId: string;
  quantity: number;
  reason?: string;
}): Promise<StockMovementWithProduct> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "adjust", ...data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to adjust stock");
  }
  return response.json();
}

// React Query Hooks
export function useStockHistory(params?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  type?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["stock-history", params],
    queryFn: () => fetchStockHistory(params),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
