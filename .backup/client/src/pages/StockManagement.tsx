import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Package, AlertTriangle, Plus, Minus, 
  Save, TrendingDown, Search as SearchIcon
} from "lucide-react";
import { Link } from "wouter";
import LaserFlow from "@/components/LaserFlow";
import { toast } from "sonner";

export default function StockManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockAction, setStockAction] = useState<"set" | "adjust" | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const utils = trpc.useUtils();

  // Fetch low stock products
  const { data: lowStockProducts, isLoading: lowStockLoading } = trpc.products.getLowStock.useQuery({ limit: 100 });

  // Search products
  const { data: searchResults } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 2 }
  );

  // Update stock mutation
  const updateStockMutation = trpc.products.updateStock.useMutation({
    onSuccess: () => {
      toast.success("Stock updated successfully");
      utils.products.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update stock: ${error.message}`);
    },
  });

  // Adjust stock mutation
  const adjustStockMutation = trpc.products.adjustStock.useMutation({
    onSuccess: () => {
      toast.success("Stock adjusted successfully");
      utils.products.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to adjust stock: ${error.message}`);
    },
  });

  const openSetStockDialog = (product: any) => {
    setSelectedProduct(product);
    setStockAction("set");
    setStockValue(String(product.stock_quantity || 0));
  };

  const openAdjustStockDialog = (product: any) => {
    setSelectedProduct(product);
    setStockAction("adjust");
    setStockValue("");
    setAdjustmentReason("");
  };

  const closeDialog = () => {
    setSelectedProduct(null);
    setStockAction(null);
    setStockValue("");
    setAdjustmentReason("");
  };

  const handleSaveStock = () => {
    if (!selectedProduct) return;

    if (stockAction === "set") {
      const quantity = parseInt(stockValue);
      if (isNaN(quantity) || quantity < 0) {
        toast.error("Please enter a valid quantity");
        return;
      }
      updateStockMutation.mutate({
        id: selectedProduct.id,
        quantity,
      });
    } else if (stockAction === "adjust") {
      const adjustment = parseInt(stockValue);
      if (isNaN(adjustment)) {
        toast.error("Please enter a valid adjustment");
        return;
      }
      if (!adjustmentReason.trim()) {
        toast.error("Please provide a reason for the adjustment");
        return;
      }
      adjustStockMutation.mutate({
        id: selectedProduct.id,
        adjustment,
        reason: adjustmentReason,
      });
    }
  };

  const displayProducts = searchQuery.length > 2 ? searchResults : lowStockProducts;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* LaserFlow Background */}
      <div className="absolute inset-0 z-0">
        <LaserFlow
          color="#7FBF3F"
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0.0}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
          <div className="container mx-auto px-6 py-4">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Stock Management
              </h1>
              <p className="text-gray-400 text-lg">
                Update inventory levels and manage stock
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products to update stock..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Low Stock Alert */}
            {!searchQuery && lowStockProducts && lowStockProducts.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/30 backdrop-blur-sm p-6 mb-8">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {lowStockProducts.length} Low Stock Items
                    </h3>
                    <p className="text-gray-400 text-sm">
                      These products are at or below their reorder point
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Products List */}
            {lowStockLoading && !searchQuery && (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading products...</p>
              </div>
            )}

            {displayProducts && displayProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    {searchQuery ? `Search Results (${displayProducts.length})` : `Low Stock Items (${displayProducts.length})`}
                  </h2>
                </div>

                {displayProducts.map((product) => (
                  <StockProductCard
                    key={product.id}
                    product={product}
                    onSetStock={() => openSetStockDialog(product)}
                    onAdjustStock={() => openAdjustStockDialog(product)}
                  />
                ))}
              </div>
            )}

            {displayProducts && displayProducts.length === 0 && searchQuery.length > 2 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                <p className="text-gray-400">Try a different search term</p>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Stock Update Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-[#1a1a24] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>
              {stockAction === "set" ? "Set Stock Level" : "Adjust Stock"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedProduct?.name} ({selectedProduct?.sku})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {stockAction === "set" && (
              <div>
                <Label htmlFor="stock-quantity" className="text-white mb-2 block">
                  New Stock Quantity
                </Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="Enter quantity"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Current: {selectedProduct?.stock_quantity || 0}
                </p>
              </div>
            )}

            {stockAction === "adjust" && (
              <>
                <div>
                  <Label htmlFor="adjustment" className="text-white mb-2 block">
                    Adjustment (+/-)
                  </Label>
                  <Input
                    id="adjustment"
                    type="number"
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="e.g., +10 or -5"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Current: {selectedProduct?.stock_quantity || 0} → New: {(selectedProduct?.stock_quantity || 0) + (parseInt(stockValue) || 0)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="reason" className="text-white mb-2 block">
                    Reason
                  </Label>
                  <Input
                    id="reason"
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="e.g., Received shipment, Damaged goods"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="bg-white/5 border-white/20">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStock}
              disabled={updateStockMutation.isPending || adjustStockMutation.isPending}
              className="bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stock Product Card Component
function StockProductCard({ 
  product, 
  onSetStock, 
  onAdjustStock 
}: { 
  product: any; 
  onSetStock: () => void;
  onAdjustStock: () => void;
}) {
  const isLowStock = (product.stock_quantity || 0) <= (product.reorder_point || 0);

  return (
    <Card className={`backdrop-blur-sm p-6 transition-all ${
      isLowStock 
        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15' 
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-green-400 bg-green-500/20 px-2 py-1 rounded">
              {product.sku}
            </span>
            {isLowStock && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Low Stock
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
          
          {product.application && (
            <p className="text-sm text-gray-400">{product.application}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div>
              <span className="text-gray-400">Current: </span>
              <span className={`font-semibold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                {product.stock_quantity || 0}
              </span>
            </div>
            {product.reorder_point && (
              <div>
                <span className="text-gray-400">Reorder Point: </span>
                <span className="text-white font-semibold">{product.reorder_point}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAdjustStock}
            className="bg-white/5 border-white/20 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            <Minus className="w-4 h-4 mr-2" />
            Adjust
          </Button>
          <Button
            size="sm"
            onClick={onSetStock}
            className="bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a]"
          >
            <Save className="w-4 h-4 mr-2" />
            Set Stock
          </Button>
        </div>
      </div>
    </Card>
  );
}

