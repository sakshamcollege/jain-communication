"use client";

import { Product } from "@/lib/types";
import { formatCurrency, isLowStock } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Edit, Trash2, TrendingUp } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete, onClick }: ProductCardProps) {
  const profit = product.sellingPrice - product.purchasePrice;
  const profitPercentage = product.purchasePrice > 0 
    ? ((profit / product.purchasePrice) * 100).toFixed(1)
    : "0";
  const lowStock = isLowStock(product.stock);

  return (
    <Card 
      className={`transition-all hover:shadow-md ${onClick ? "cursor-pointer" : ""} ${lowStock ? "border-red-200" : ""}`}
      onClick={() => onClick?.(product)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{product.name}</h3>
              {lowStock && (
                <Badge variant="destructive" className="text-xs shrink-0">
                  Low Stock
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-xs mb-2">
              {product.category}
            </Badge>
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Selling Price</p>
                <p className="font-medium">{formatCurrency(product.sellingPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Stock</p>
                <p className={`font-medium ${lowStock ? "text-red-600" : ""}`}>
                  {product.stock} units
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-2 text-xs">
              <TrendingUp className={`w-3 h-3 ${profit >= 0 ? "text-green-600" : "text-red-600"}`} />
              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(profit)} ({profitPercentage}%)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="p-2 bg-muted rounded-full">
              {product.frontImage ? (
                <img src={product.frontImage} alt={product.name} className="w-10 h-10 object-cover rounded-full" />
              ) : (
                <Package className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            {(onEdit || onDelete) && (
              <div className="flex flex-col gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(product);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(product);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
