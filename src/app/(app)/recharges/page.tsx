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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecharges, useDeleteRecharge } from "@/lib/hooks/useRecharges";
import { RechargeForm } from "@/components/RechargeForm";
import { formatCurrency, formatDateTime, getStartOfToday, getStartOfWeek, getStartOfMonth } from "@/lib/helpers";
import {
  Plus,
  Smartphone,
  TrendingUp,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react";
import { RechargeListSkeleton } from "@/components/Skeletons";

type DateFilter = "today" | "week" | "month" | "all";

function RechargesPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  const getDateRange = () => {
    switch (dateFilter) {
      case "today":
        return { startDate: getStartOfToday().toISOString() };
      case "week":
        return { startDate: getStartOfWeek().toISOString() };
      case "month":
        return { startDate: getStartOfMonth().toISOString() };
      default:
        return {};
    }
  };

  const { data: recharges, isLoading } = useRecharges(getDateRange());
  const deleteRecharge = useDeleteRecharge();

  const dateFilterLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  const handleDelete = async (id: string, amount: number) => {
    if (!confirm(`Delete recharge of ${formatCurrency(amount)}?`)) return;
    
    setDeletingId(id);
    try {
      await deleteRecharge.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete recharge:", error);
      alert("Failed to delete recharge");
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate totals
  const totalAmount = recharges?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalProfit = recharges?.reduce((sum, r) => sum + r.profit, 0) || 0;

  return (
    <div className="container mx-auto p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recharges</h1>
          <p className="text-muted-foreground">{dateFilterLabel[dateFilter]} mobile recharge records</p>
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
              <span className="text-sm">{dateFilterLabel[dateFilter]} Recharges</span>
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

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(recharge.amount)}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        +{formatCurrency(recharge.profit)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(recharge.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(recharge.id, recharge.amount)}
                      disabled={deletingId === recharge.id}
                    >
                      {deletingId === recharge.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
            <Smartphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No recharges found</h3>
            <p className="text-muted-foreground mb-4">
              {dateFilter === "all"
                ? "Record your first recharge to get started"
                : `No recharges recorded for ${dateFilterLabel[dateFilter].toLowerCase()}`}
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
