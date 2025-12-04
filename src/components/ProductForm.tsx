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
import { Loader2, Camera, Sparkles } from "lucide-react";

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
    description: product?.description || "",
    specs: product?.specs || "",
    frontImage: product?.frontImage || "",
    backImage: product?.backImage || "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'frontImage' | 'backImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await fileToBase64(file);
    handleInputChange(field, base64);

    if (confirm("Do you want to auto-fill details from this image?")) {
      analyzeImage(base64);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        if (!formData.name) handleInputChange("name", result.data.name);
        if (!formData.description) handleInputChange("description", result.data.description);
        if (!formData.specs) handleInputChange("specs", result.data.specs);
        
        const labels = result.data.detectedLabels;
        if (labels.includes("Smartphone") || labels.includes("Mobile phone")) {
           handleInputChange("category", "Smartphone");
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze image. Please enter details manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto">
        
        {/* Image Upload Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Front Image</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer relative h-40 flex items-center justify-center overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => handleImageUpload(e, 'frontImage')}
              />
              {formData.frontImage ? (
                <img src={formData.frontImage} alt="Front" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-xs">Upload Front</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Back Image (Specs)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer relative h-40 flex items-center justify-center overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => handleImageUpload(e, 'backImage')}
              />
              {formData.backImage ? (
                <img src={formData.backImage} alt="Back" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-xs">Upload Back</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-md text-sm">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Analyzing image for specs...
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Samsung Galaxy S24"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
            disabled={isLoading}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange("category", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-10">
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

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
          <textarea
            id="description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Product description..."
            value={formData.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="specs" className="text-sm font-medium">Specifications</Label>
          <textarea
            id="specs"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="RAM: 8GB&#10;Storage: 128GB&#10;Battery: 5000mAh"
            value={formData.specs || ""}
            onChange={(e) => handleInputChange("specs", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="purchasePrice" className="text-sm font-medium">Purchase Price (₹) *</Label>
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
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price (₹) *</Label>
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
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock" className="text-sm font-medium">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            placeholder="0"
            value={formData.stock || ""}
            onChange={(e) => handleInputChange("stock", parseInt(e.target.value) || 0)}
            required
            disabled={isLoading}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="imei" className="text-sm font-medium">IMEI (Optional)</Label>
          <Input
            id="imei"
            placeholder="Enter IMEI number"
            value={formData.imei || ""}
            onChange={(e) => handleInputChange("imei", e.target.value)}
            disabled={isLoading}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supplier" className="text-sm font-medium">Supplier (Optional)</Label>
          <Input
            id="supplier"
            placeholder="e.g., Samsung Distributor"
            value={formData.supplier || ""}
            onChange={(e) => handleInputChange("supplier", e.target.value)}
            disabled={isLoading}
            className="h-10"
          />
        </div>

        {/* Profit Preview */}
        {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">Expected Profit per unit</p>
            <p className={`text-base font-semibold ${formData.sellingPrice > formData.purchasePrice ? "text-green-600" : "text-red-600"}`}>
              ₹{(formData.sellingPrice - formData.purchasePrice).toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                ({((formData.sellingPrice - formData.purchasePrice) / formData.purchasePrice * 100).toFixed(1)}%)
              </span>
            </p>
          </div>
        )}

        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-lg">
            {createMutation.error?.message || updateMutation.error?.message}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4 mt-4 border-t bg-background sticky bottom-0">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-10" disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 h-10" disabled={isLoading}>
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
    </form>
  );
}
