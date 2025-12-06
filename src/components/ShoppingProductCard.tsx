"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart } from "lucide-react";

interface ShoppingProductCardProps {
  product: Product;
}

export function ShoppingProductCard({ product }: ShoppingProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine which image to show
  // If hovered and backImage exists, show backImage
  // Otherwise show frontImage
  // If no frontImage, show placeholder
  const displayImage = isHovered && product.backImage ? product.backImage : product.frontImage;

  return (
    <Card 
      className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted p-4">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="w-12 h-12" />
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-1">Out of Stock</Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className="mb-2">{product.category}</Badge>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs text-red-500 font-medium">Only {product.stock} left!</span>
          )}
        </div>
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
        )}
        {product.specs && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded line-clamp-2">
            {product.specs}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Price</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(product.sellingPrice)}
          </span>
        </div>
        <Button disabled={product.stock <= 0} size="sm" className="gap-2">
          <ShoppingCart className="w-4 h-4" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}
