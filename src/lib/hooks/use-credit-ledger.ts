"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PartyType = "CUSTOMER" | "VENDOR";
export type CreditTransactionType = "CHARGE" | "PAYMENT";
export type CreditSourceType = "RECHARGE" | "EXPENSE" | "MANUAL";

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  normalizedName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartyWithBalance extends Party {
  chargesTotal: number;
  paymentsTotal: number;
  balance: number;
}

export interface CreditTransaction {
  id: string;
  partyId: string;
  type: CreditTransactionType;
  source: CreditSourceType;
  sourceId: string | null;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface PartyLedgerResponse {
  party: Party;
  transactions: CreditTransaction[];
  chargesTotal: number;
  paymentsTotal: number;
  balance: number;
}

async function fetchCreditLedger(): Promise<PartyWithBalance[]> {
  const res = await fetch("/api/credit-ledger");
  if (!res.ok) throw new Error("Failed to fetch credit ledger");
  return res.json();
}

async function fetchPartyLedger(partyId: string): Promise<PartyLedgerResponse> {
  const res = await fetch(`/api/credit-ledger/parties/${partyId}`);
  if (!res.ok) throw new Error("Failed to fetch party ledger");
  return res.json();
}

async function recordPayment(partyId: string, amount: number, note?: string) {
  const res = await fetch(`/api/credit-ledger/parties/${partyId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, note }),
  });
  if (!res.ok) throw new Error("Failed to record payment");
  return res.json();
}

export function useCreditLedger() {
  return useQuery({
    queryKey: ["credit-ledger"],
    queryFn: fetchCreditLedger,
  });
}

export function usePartyLedger(partyId: string) {
  return useQuery({
    queryKey: ["credit-ledger", partyId],
    queryFn: () => fetchPartyLedger(partyId),
    enabled: Boolean(partyId),
  });
}

export function useRecordPayment(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      recordPayment(partyId, amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["credit-ledger", partyId] });
    },
  });
}
