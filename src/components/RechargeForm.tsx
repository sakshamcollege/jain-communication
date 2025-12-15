"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRecharge, useUpdateRecharge, Recharge } from "@/lib/hooks/useRecharges";
import { useParties } from "@/lib/hooks";
import { Loader2, Smartphone, Zap, Save } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";

const COMMISSION_PERCENT = 3;

interface RechargeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editRecharge?: Recharge | null;
}

export function RechargeForm({ onSuccess, onCancel, editRecharge }: RechargeFormProps) {
  const [amount, setAmount] = useState(() => (editRecharge ? editRecharge.amount.toString() : ""));
  const [description, setDescription] = useState(() => (editRecharge ? editRecharge.description || "" : ""));
  const [isCredit, setIsCredit] = useState(() => Boolean(editRecharge?.isCredit));
  const [partyId, setPartyId] = useState<string>("");
  const [partyName, setPartyName] = useState("");
  const [partyPhone, setPartyPhone] = useState("");

  const { data: parties } = useParties("CUSTOMER");

  const createRecharge = useCreateRecharge();
  const updateRecharge = useUpdateRecharge();

  const isEditing = !!editRecharge;
  const isPending = createRecharge.isPending || updateRecharge.isPending;

  const calculatedProfit = amount ? (parseFloat(amount) * COMMISSION_PERCENT) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      if (isEditing) {
        await updateRecharge.mutateAsync({
          id: editRecharge.id,
          amount: parseFloat(amount),
          description: description || undefined,
        });
      } else {
        if (isCredit && !partyId && partyName.trim().length < 2) {
          alert("Please enter customer name for credit recharge");
          return;
        }

        await createRecharge.mutateAsync({
          amount: parseFloat(amount),
          description: description || undefined,
          ...(isCredit
            ? {
                isCredit: true,
                ...(partyId
                  ? { partyId }
                  : {
                      partyName: partyName.trim(),
                      partyPhone: partyPhone.trim() || undefined,
                    }),
              }
            : { isCredit: false }),
        });
      }

      // Reset form
      setAmount("");
      setDescription("");
      setIsCredit(false);
      setPartyId("");
      setPartyName("");
      setPartyPhone("");

      onSuccess?.();
    } catch (error) {
      console.error("Failed to save recharge:", error);
      alert(`Failed to ${isEditing ? "update" : "record"} recharge`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Total Recharge Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Total Recharge Amount (₹) *</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 1000"
          min="1"
          step="1"
          disabled={isPending}
          autoFocus
        />
      </div>

      {/* Optional Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Daily mobile recharges"
          disabled={isPending}
        />
      </div>

      {/* Credit Toggle (create only) */}
      {!isEditing && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">On Credit</p>
              <p className="text-xs text-muted-foreground">Track this recharge under a customer</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCredit((v) => !v)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              disabled={isPending}
              aria-pressed={isCredit}
            >
              {isCredit ? "Yes" : "No"}
            </button>
          </div>

          {isCredit && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={partyId || "new"}
                  onValueChange={(v) => {
                    if (v === "new") {
                      setPartyId("");
                      return;
                    }
                    setPartyId(v);
                    setPartyName("");
                    setPartyPhone("");
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New customer…</SelectItem>
                    {(parties || []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.phone ? ` • ${p.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partyName">Customer Name *</Label>
                <Input
                  id="partyName"
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g., Rahul"
                  disabled={isPending || Boolean(partyId)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyPhone">Phone (optional)</Label>
                <Input
                  id="partyPhone"
                  type="tel"
                  value={partyPhone}
                  onChange={(e) => setPartyPhone(e.target.value)}
                  placeholder="e.g., 9876543210"
                  disabled={isPending || Boolean(partyId)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profit Preview */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Commission ({COMMISSION_PERCENT}%)</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(calculatedProfit)}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12"
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 h-12 text-lg"
          disabled={isPending || !amount}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isEditing ? "Updating..." : "Recording..."}
            </>
          ) : isEditing ? (
            <>
              <Save className="mr-2 h-5 w-5" />
              Update Recharge
            </>
          ) : (
            <>
              <Smartphone className="mr-2 h-5 w-5" />
              Record Recharge
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
