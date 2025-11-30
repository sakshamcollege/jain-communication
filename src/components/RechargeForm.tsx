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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateRecharge } from "@/lib/hooks/useRecharges";
import { Loader2, Smartphone, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";

const RECHARGE_TYPES = [
  { value: "PREPAID", label: "Prepaid Mobile" },
  { value: "POSTPAID", label: "Postpaid Mobile" },
  { value: "DTH", label: "DTH / Dish TV" },
  { value: "ELECTRICITY", label: "Electricity Bill" },
  { value: "DATA_CARD", label: "Data Card" },
  { value: "BROADBAND", label: "Broadband" },
  { value: "GAS", label: "Gas Bill" },
];

const OPERATORS = {
  PREPAID: ["Jio", "Airtel", "VI (Vodafone Idea)", "BSNL"],
  POSTPAID: ["Jio", "Airtel", "VI (Vodafone Idea)", "BSNL"],
  DTH: ["Tata Play", "Airtel Digital TV", "Dish TV", "Sun Direct", "D2H"],
  ELECTRICITY: ["State Electricity Board", "Tata Power", "Adani", "BSES", "Other"],
  DATA_CARD: ["Jio", "Airtel", "VI", "BSNL"],
  BROADBAND: ["Jio Fiber", "Airtel Xstream", "ACT", "BSNL", "Hathway"],
  GAS: ["Indane", "HP Gas", "Bharat Gas", "Other"],
};

const COMMISSION_PERCENT = 3.5;

interface RechargeFormProps {
  onSuccess?: () => void;
}

export function RechargeForm({ onSuccess }: RechargeFormProps) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("");
  const [operator, setOperator] = useState("");

  const createRecharge = useCreateRecharge();

  const calculatedProfit = amount ? (parseFloat(amount) * COMMISSION_PERCENT) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mobileNumber || !amount || !type) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createRecharge.mutateAsync({
        mobileNumber,
        amount: parseFloat(amount),
        type,
        operator: operator || undefined,
      });

      // Reset form
      setMobileNumber("");
      setAmount("");
      setType("");
      setOperator("");

      onSuccess?.();
    } catch (error) {
      console.error("Failed to create recharge:", error);
      alert("Failed to record recharge");
    }
  };

  const availableOperators = type ? OPERATORS[type as keyof typeof OPERATORS] || [] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          New Recharge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recharge Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Recharge Type *</Label>
            <Select value={type} onValueChange={(value) => {
              setType(value);
              setOperator(""); // Reset operator when type changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RECHARGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator */}
          {availableOperators.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mobile Number / Account Number */}
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">
              {type === "ELECTRICITY" || type === "GAS" ? "Account Number *" : "Mobile Number *"}
            </Label>
            <Input
              id="mobileNumber"
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder={type === "ELECTRICITY" || type === "GAS" ? "Enter account number" : "Enter mobile number"}
              maxLength={type === "ELECTRICITY" || type === "GAS" ? 20 : 10}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="1"
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
            disabled={createRecharge.isPending || !mobileNumber || !amount || !type}
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
