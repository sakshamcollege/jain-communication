"use client";

import { useState, useEffect } from "react";
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
import { useCreateExpense, useUpdateExpense } from "@/lib/hooks";
import { PAYMENT_MODES, PaymentMode, Expense } from "@/lib/types";
import { Loader2, CreditCard, Save } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editExpense?: Expense | null;
}

export function ExpenseForm({ onSuccess, onCancel, editExpense }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
  const [description, setDescription] = useState("");

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const isEditing = !!editExpense;
  const isPending = createExpense.isPending || updateExpense.isPending;

  // Populate form when editing
  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setPaymentMode(editExpense.paymentMode);
      setDescription(editExpense.description);
    } else {
      setAmount("");
      setPaymentMode("");
      setDescription("");
    }
  }, [editExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    if (!paymentMode) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    try {
      if (isEditing) {
        await updateExpense.mutateAsync({
          id: editExpense.id,
          amount: parseFloat(amount),
          paymentMode: paymentMode as PaymentMode,
          description: description.trim(),
        });
        
        // Reset form
        setAmount("");
        setPaymentMode("");
        setDescription("");

        onSuccess?.();
      } else {
        // Optimistic update - fire and forget
        createExpense.mutate({
          amount: parseFloat(amount),
          paymentMode: paymentMode as PaymentMode,
          description: description.trim(),
        });

        // Close immediately
        setAmount("");
        setPaymentMode("");
        setDescription("");

        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Payment Mode */}
      <div className="space-y-2">
        <Label htmlFor="paymentMode" className="text-sm font-medium">
          Payment Mode *
        </Label>
        <Select
          value={paymentMode}
          onValueChange={(v) => setPaymentMode(v as PaymentMode)}
          disabled={isPending}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select payment mode" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-medium">
          Amount (₹) *
        </Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 500"
          min="1"
          step="0.01"
          disabled={isPending}
          className="h-11"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description *
        </Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Office supplies, Transport"
          disabled={isPending}
          className="h-11"
        />
      </div>

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && paymentMode && (
        <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2 border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Payment Mode:</span>
            <span className="font-medium">{paymentMode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(parseFloat(amount))}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11"
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 h-11"
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            !paymentMode ||
            !description.trim() ||
            isPending
          }
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Updating..." : "Recording..."}
            </>
          ) : isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Expense
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Record Expense
            </>
          )}
        </Button>
      </div>

      {(createExpense.isError || updateExpense.isError) && (
        <p className="text-sm text-destructive text-center">
          Failed to {isEditing ? "update" : "record"} expense. Please try again.
        </p>
      )}
    </form>
  );
}
