"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRecharges } from "@/lib/hooks/useRecharges";
import { RechargeForm } from "@/components/RechargeForm";
import { formatCurrency, formatDateTime } from "@/lib/helpers";
import {
  Plus,
  Search,
  Smartphone,
  Tv,
  Zap,
  Wifi,
  Flame,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { RechargeListSkeleton } from "@/components/Skeletons";

const RECHARGE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "PREPAID", label: "Prepaid Mobile" },
  { value: "POSTPAID", label: "Postpaid Mobile" },
  { value: "DTH", label: "DTH / Dish TV" },
  { value: "ELECTRICITY", label: "Electricity Bill" },
  { value: "DATA_CARD", label: "Data Card" },
  { value: "BROADBAND", label: "Broadband" },
  { value: "GAS", label: "Gas Bill" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PREPAID: <Smartphone className="h-4 w-4" />,
  POSTPAID: <Smartphone className="h-4 w-4" />,
  DTH: <Tv className="h-4 w-4" />,
  ELECTRICITY: <Zap className="h-4 w-4" />,
  DATA_CARD: <CreditCard className="h-4 w-4" />,
  BROADBAND: <Wifi className="h-4 w-4" />,
  GAS: <Flame className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  PREPAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  POSTPAID: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  DTH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ELECTRICITY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DATA_CARD: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  BROADBAND: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  GAS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

function RechargesPageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: recharges, isLoading } = useRecharges({
    type: type !== "all" ? type : undefined,
    search: search || undefined,
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
          <p className="text-muted-foreground">Today&apos;s recharge transactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-12">
              <Plus className="mr-2 h-5 w-5" />
              New Recharge
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
            <p className="text-xs text-muted-foreground">{recharges?.length || 0} transactions</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Commission (3.5%)</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
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
                    <div className={`p-2 rounded-full ${TYPE_COLORS[recharge.type] || "bg-gray-100"}`}>
                      {TYPE_ICONS[recharge.type] || <Smartphone className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-semibold">{recharge.mobileNumber}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {recharge.type.replace("_", " ")}
                        </Badge>
                        {recharge.operator && (
                          <span>• {recharge.operator}</span>
                        )}
                      </div>
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
              Record your first recharge to get started
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Recharge
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
