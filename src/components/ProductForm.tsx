"use client";

import { useState } from "react";
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks";
import { Product, CreateProductInput, PRODUCT_CATEGORIES } from "@/lib/types";
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
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product;

  const [formData, setFormData] = useState<CreateProductInput>({
    name: product?.name || "",
    category: product?.category || "",
    purchasePrice: product?.purchasePrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    stock: product?.stock || 0,
    imei: product?.imei || "",
    supplier: product?.supplier || "",
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({ id: product.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleInputChange = (field: keyof CreateProductInput, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Samsung Galaxy S24"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => handleInputChange("category", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase Price (₹) *</Label>
          <Input
            id="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={formData.purchasePrice || ""}
            onChange={(e) => handleInputChange("purchasePrice", parseFloat(e.target.value) || 0)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
          <Input
            id="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={formData.sellingPrice || ""}
            onChange={(e) => handleInputChange("sellingPrice", parseFloat(e.target.value) || 0)}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stock">Stock Quantity *</Label>
        <Input
          id="stock"
          type="number"
          min="0"
          placeholder="0"
          value={formData.stock || ""}
          onChange={(e) => handleInputChange("stock", parseInt(e.target.value) || 0)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imei">IMEI (Optional)</Label>
        <Input
          id="imei"
          placeholder="Enter IMEI number"
          value={formData.imei || ""}
          onChange={(e) => handleInputChange("imei", e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier (Optional)</Label>
        <Input
          id="supplier"
          placeholder="e.g., Samsung Distributor"
          value={formData.supplier || ""}
          onChange={(e) => handleInputChange("supplier", e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Profit Preview */}
      {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Expected Profit per unit</p>
          <p className={`text-lg font-bold ${formData.sellingPrice > formData.purchasePrice ? "text-green-600" : "text-red-600"}`}>
            ₹{(formData.sellingPrice - formData.purchasePrice).toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({((formData.sellingPrice - formData.purchasePrice) / formData.purchasePrice * 100).toFixed(1)}%)
            </span>
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Product"
          ) : (
            "Add Product"
          )}
        </Button>
      </div>

      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-sm text-destructive text-center">
          {createMutation.error?.message || updateMutation.error?.message}
        </p>
      )}
    </form>
  );
}
