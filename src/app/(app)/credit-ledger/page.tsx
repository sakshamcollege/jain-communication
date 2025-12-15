"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/helpers";
import { useCreditLedger } from "@/lib/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Users, Truck, Trash2 } from "lucide-react";

type PartyType = "CUSTOMER" | "VENDOR";

async function createParty(input: { type: PartyType; name: string; phone?: string }) {
  const res = await fetch("/api/parties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create party");
  return res.json();
}

async function recordPartyPayment(input: {
  partyId: string;
  amount: number;
  note?: string;
}) {
  const res = await fetch(`/api/credit-ledger/parties/${input.partyId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amount, note: input.note }),
  });
  if (!res.ok) throw new Error("Failed to record payment");
  return res.json();
}

async function deleteParty(partyId: string) {
  const res = await fetch(`/api/parties/${partyId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete party");
  return res.json();
}

export default function CreditLedgerPage() {
  const { data, isLoading, error } = useCreditLedger();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<PartyType>("CUSTOMER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentPartyId, setPaymentPartyId] = useState<string | null>(null);
  const [paymentPartyName, setPaymentPartyName] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePartyId, setDeletePartyId] = useState<string | null>(null);
  const [deletePartyName, setDeletePartyName] = useState<string>("");

  const createPartyMutation = useMutation({
    mutationFn: createParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-ledger"] });
      setDialogOpen(false);
      setName("");
      setPhone("");
      setType("CUSTOMER");
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: recordPartyPayment,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["credit-ledger"] });
      await queryClient.invalidateQueries({ queryKey: ["credit-ledger", variables.partyId] });
      setPaymentDialogOpen(false);
      setPaymentPartyId(null);
      setPaymentPartyName("");
      setPaymentAmount("");
      setPaymentNote("");
    },
  });

  const deletePartyMutation = useMutation({
    mutationFn: deleteParty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credit-ledger"] });
      setDeleteDialogOpen(false);
      setDeletePartyId(null);
      setDeletePartyName("");
    },
  });

  const summary = useMemo(() => {
    const rows = data ?? [];
    const customerTotal = rows
      .filter((p) => p.type === "CUSTOMER")
      .reduce((sum, p) => sum + (p.balance || 0), 0);

    const vendorTotal = rows
      .filter((p) => p.type === "VENDOR")
      .reduce((sum, p) => sum + (p.balance || 0), 0);

    return { customerTotal, vendorTotal };
  }, [data]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load credit ledger</h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Credit Ledger</h1>
          <p className="text-muted-foreground">Customers & vendors credit balances</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Party</DialogTitle>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                createPartyMutation.mutate({
                  type,
                  name: name.trim(),
                  phone: phone.trim() || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as PartyType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="VENDOR">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partyName">Name *</Label>
                <Input
                  id="partyName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === "CUSTOMER" ? "e.g., Rahul" : "e.g., Stationery Shop"}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partyPhone">Phone (optional)</Label>
                <Input
                  id="partyPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 9876543210"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                  disabled={createPartyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createPartyMutation.isPending || name.trim().length < 2}
                >
                  {createPartyMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            setPaymentPartyId(null);
            setPaymentPartyName("");
            setPaymentAmount("");
            setPaymentNote("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment{paymentPartyName ? ` • ${paymentPartyName}` : ""}</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!paymentPartyId) return;
              const numeric = Number(paymentAmount);
              if (!numeric || numeric <= 0) return;
              recordPaymentMutation.mutate({
                partyId: paymentPartyId,
                amount: numeric,
                note: paymentNote.trim() || undefined,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g., 500"
                autoFocus
                disabled={recordPaymentMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNote">Note (optional)</Label>
              <Input
                id="paymentNote"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g., UPI / Cash"
                disabled={recordPaymentMutation.isPending}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  recordPaymentMutation.isPending ||
                  !paymentPartyId ||
                  !paymentAmount ||
                  Number(paymentAmount) <= 0
                }
              >
                {recordPaymentMutation.isPending ? "Saving..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeletePartyId(null);
            setDeletePartyName("");
          }
        }}
        title={deletePartyName ? `Delete ${deletePartyName}?` : "Delete party?"}
        description="This will remove the party from the database. Related ledger transactions will also be removed."
        isDeleting={deletePartyMutation.isPending}
        onConfirm={() => {
          if (!deletePartyId) return;
          deletePartyMutation.mutate(deletePartyId);
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Customers (to receive)</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.customerTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span className="text-sm">Vendors (to pay)</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.vendorTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((party) => (
            <Card key={party.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/credit-ledger/${party.id}`} className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{party.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {party.type === "CUSTOMER" ? "Customer" : "Vendor"}
                      {party.phone ? ` • ${party.phone}` : ""}
                    </p>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold">{formatCurrency(party.balance)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPaymentPartyId(party.id);
                        setPaymentPartyName(party.name);
                        setPaymentDialogOpen(true);
                      }}
                    >
                      Record Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeletePartyId(party.id);
                        setDeletePartyName(party.name);
                        setDeleteDialogOpen(true);
                      }}
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
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No parties yet</h3>
            <p className="text-muted-foreground">Add a customer/vendor to start tracking credit.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
