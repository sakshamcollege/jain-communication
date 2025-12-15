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
import { BookOpen, Plus, Users, Truck } from "lucide-react";

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

export default function CreditLedgerPage() {
  const { data, isLoading, error } = useCreditLedger();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<PartyType>("CUSTOMER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

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
            <Link key={party.id} href={`/credit-ledger/${party.id}`}>
              <Card className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{party.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {party.type === "CUSTOMER" ? "Customer" : "Vendor"}
                        {party.phone ? ` • ${party.phone}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold">{formatCurrency(party.balance)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
