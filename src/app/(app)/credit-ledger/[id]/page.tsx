"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { formatCurrency, formatDateTime } from "@/lib/helpers";
import {
  useDeleteCreditTransaction,
  usePartyLedger,
  useRecordPayment,
  useUpdateCreditTransaction,
} from "@/lib/hooks";
import { ArrowLeft, Pencil, ReceiptIndianRupee, Trash2, Wallet } from "lucide-react";

export default function PartyLedgerPage() {
  const params = useParams<{ id: string }>();
  const partyId = params?.id;

  const { data, isLoading, error } = usePartyLedger(partyId);
  const recordPayment = useRecordPayment(partyId);
  const updateTransaction = useUpdateCreditTransaction(partyId);
  const deleteTransaction = useDeleteCreditTransaction(partyId);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!data?.party) return "Party";
    return data.party.name;
  }, [data]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/credit-ledger" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <Card>
          <CardContent className="p-6">Failed to load party ledger.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/credit-ledger" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold mt-2">{title}</h1>
          {data?.party && (
            <p className="text-muted-foreground">
              {data.party.type === "CUSTOMER" ? "Customer" : "Vendor"}
              {data.party.phone ? ` • ${data.party.phone}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ReceiptIndianRupee className="h-4 w-4" />
              <span className="text-sm">Balance</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(data?.balance ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Payments</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(data?.paymentsTotal ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold">Record Payment</h2>
          <p className="text-sm text-muted-foreground">
            {data?.party?.type === "VENDOR" ? "Record money you paid to this vendor" : "Record money received from this customer"}
          </p>

          <form
            className="mt-4 grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const numeric = Number(amount);
              if (!numeric || numeric <= 0) return;
              recordPayment.mutate(
                { amount: numeric, note: note.trim() || undefined },
                {
                  onSuccess: () => {
                    setAmount("");
                    setNote("");
                  },
                }
              );
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500"
                disabled={recordPayment.isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="paymentNote">Note (optional)</Label>
              <Input
                id="paymentNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., UPI / Cash"
                disabled={recordPayment.isPending}
              />
            </div>
            <div className="md:col-span-3">
              <Button
                type="submit"
                disabled={recordPayment.isPending || !amount || Number(amount) <= 0}
              >
                {recordPayment.isPending ? "Saving..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">Transactions</h2>

        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) {
              setEditTransactionId(null);
              setEditAmount("");
              setEditNote("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editTransactionId) return;
                const numeric = Number(editAmount);
                if (!numeric || numeric <= 0) return;
                updateTransaction.mutate(
                  {
                    transactionId: editTransactionId,
                    amount: numeric,
                    note: editNote.trim() || undefined,
                  },
                  {
                    onSuccess: () => setEditOpen(false),
                  }
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="editAmount">Amount *</Label>
                <Input
                  id="editAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="e.g., 500"
                  autoFocus
                  disabled={updateTransaction.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNote">Note (optional)</Label>
                <Input
                  id="editNote"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g., UPI / Cash"
                  disabled={updateTransaction.isPending}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditOpen(false)}
                  disabled={updateTransaction.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    updateTransaction.isPending ||
                    !editTransactionId ||
                    !editAmount ||
                    Number(editAmount) <= 0
                  }
                >
                  {updateTransaction.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <DeleteConfirmationDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setDeleteTransactionId(null);
          }}
          title="Delete transaction?"
          description="This will permanently delete this transaction."
          isDeleting={deleteTransaction.isPending}
          onConfirm={() => {
            if (!deleteTransactionId) return;
            deleteTransaction.mutate(deleteTransactionId, {
              onSuccess: () => setDeleteOpen(false),
            });
          }}
        />

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : data?.transactions && data.transactions.length > 0 ? (
          data.transactions.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {t.type === "CHARGE" ? "Charge" : "Payment"} • {t.source}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</p>
                    {t.note && <p className="text-sm text-muted-foreground mt-1">{t.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-bold">{formatCurrency(t.amount)}</p>
                    </div>

                    {t.source === "MANUAL" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditTransactionId(t.id);
                            setEditAmount(String(t.amount ?? ""));
                            setEditNote(t.note ?? "");
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => {
                            setDeleteTransactionId(t.id);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No transactions yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
