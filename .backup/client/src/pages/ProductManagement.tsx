import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Save,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ProductManagement() {
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Fetch products
  const { data: products, isLoading, refetch } = trpc.products.list.useQuery({ limit: 100 });

  // Mutations
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    }
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setEditingProduct(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    }
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    }
  });

  // Filter products by search query
  const filteredProducts = products?.filter(p =>
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.application?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!permissions.canEditProducts) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to manage products.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-green-400" />
              Product Management
            </h1>
            <p className="text-gray-400 mt-2">Add, edit, and manage your inventory</p>
          </div>
          {permissions.canEditProducts && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, name, or application..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </Card>

        {/* Products Table */}
        {isLoading ? (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <p className="text-gray-400">Loading products...</p>
          </Card>
        ) : (
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Application
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.primary_image ? (
                          <img
                            src={product.primary_image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-green-400">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white">{product.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{product.application || "-"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">{product.stock_quantity || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : product.status === 'inactive'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.canEditProducts && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingProduct(product)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {permissions.canDeleteProducts && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                                  deleteProduct.mutate({ id: product.id });
                                }
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Product Dialog */}
      <ProductFormDialog
        open={isAddDialogOpen || !!editingProduct}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={(data) => {
          if (editingProduct) {
            updateProduct.mutate({ id: editingProduct.id, ...data });
          } else {
            createProduct.mutate(data);
          }
        }}
      />
    </div>
  );
}

// Product Form Dialog Component
function ProductFormDialog({
  open,
  onClose,
  product,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  product: any;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState(product || {
    sku: "",
    name: "",
    description: "",
    category: "",
    application: "",
    years: "",
    stock_quantity: 0,
    reorder_point: 5,
    unit_cost: 0,
    unit_price: 0,
    status: "active",
    primary_image: "",
    precision_number: "",
    quality_number: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>SKU *</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Product Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label>Application</Label>
              <Input
                value={formData.application || ""}
                onChange={(e) => setFormData({ ...formData, application: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., 2005-2010 Honda Accord"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label>Reorder Point</Label>
              <Input
                type="number"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label>Unit Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_price ? formData.unit_price / 100 : 0}
                onChange={(e) => setFormData({ ...formData, unit_price: Math.round(parseFloat(e.target.value) * 100) })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label>Primary Image URL</Label>
            <Input
              value={formData.primary_image || ""}
              onChange={(e) => setFormData({ ...formData, primary_image: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="https://example.com/image.jpg"
            />
            {formData.primary_image && (
              <img
                src={formData.primary_image}
                alt="Preview"
                className="mt-2 w-32 h-32 object-cover rounded border border-white/10"
              />
            )}
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-green-600">
              <Save className="w-4 h-4 mr-2" />
              Save Product
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
