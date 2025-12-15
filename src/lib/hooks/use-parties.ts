"use client";

import { useQuery } from "@tanstack/react-query";

export type PartyType = "CUSTOMER" | "VENDOR";

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  normalizedName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchParties(type: PartyType): Promise<Party[]> {
  const params = new URLSearchParams({ type });
  const res = await fetch(`/api/parties?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch parties");
  return res.json();
}

export function useParties(type: PartyType) {
  return useQuery({
    queryKey: ["parties", type],
    queryFn: () => fetchParties(type),
    enabled: Boolean(type),
  });
}
