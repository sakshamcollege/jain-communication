"use client";

import { useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRecharges } from "@/lib/hooks/useRecharges";
import { RechargeForm } from "@/components/RechargeForm";
import { formatCurrency, formatDateTime } from "@/lib/helpers";
import {
  Plus,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { RechargeListSkeleton } from "@/components/Skeletons";

function RechargesPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: recharges, isLoading } = useRecharges({
    startDate: today.toISOString(),
  });

  // Calculate totals
  const totalAmount = recharges?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalProfit = recharges?.reduce((sum, r) => sum + r.profit, 0) || 0;

  return (
    <div className="container mx-auto p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recharges</h1>
          <p className="text-muted-foreground">Today&apos;s mobile recharge records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-12">
              <Plus className="mr-2 h-5 w-5" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Recharge</DialogTitle>
            </DialogHeader>
            <RechargeForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm">Total Recharges</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{recharges?.length || 0} entries</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Commission (3%)</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recharges List */}
      {isLoading ? (
        <RechargeListSkeleton />
      ) : recharges && recharges.length > 0 ? (
        <div className="space-y-3">
          {recharges.map((recharge) => (
            <Card key={recharge.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="font-semibold">Mobile Recharge</p>
                      {recharge.description && (
                        <p className="text-sm text-muted-foreground">
                          {recharge.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(recharge.amount)}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      +{formatCurrency(recharge.profit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(recharge.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No recharges today</h3>
            <p className="text-muted-foreground mb-4">
              Record your total recharge amount to track commission
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RechargesPage() {
  return (
    <Suspense fallback={<RechargeListSkeleton />}>
      <RechargesPageContent />
    </Suspense>
  );
}
