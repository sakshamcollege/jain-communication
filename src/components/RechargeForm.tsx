"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateRecharge } from "@/lib/hooks/useRecharges";
import { Loader2, Smartphone, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";

const COMMISSION_PERCENT = 3;

interface RechargeFormProps {
  onSuccess?: () => void;
}

export function RechargeForm({ onSuccess }: RechargeFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const createRecharge = useCreateRecharge();

  const calculatedProfit = amount ? (parseFloat(amount) * COMMISSION_PERCENT) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await createRecharge.mutateAsync({
        amount: parseFloat(amount),
        description: description || undefined,
      });

      // Reset form
      setAmount("");
      setDescription("");

      onSuccess?.();
    } catch (error) {
      console.error("Failed to create recharge:", error);
      alert("Failed to record recharge");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Record Recharge
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            />
          </div>

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

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={createRecharge.isPending || !amount}
          >
            {createRecharge.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-5 w-5" />
                Record Recharge
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
