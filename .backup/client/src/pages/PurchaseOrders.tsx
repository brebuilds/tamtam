import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PurchaseOrders() {
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Fetch POs
  const { data: pos, isLoading, refetch } = trpc.purchaseOrders.list.useQuery();

  // Filter POs
  const filteredPOs = pos?.filter(po =>
    po.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!permissions.canViewPOs) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to view purchase orders.</p>
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
              <FileText className="w-8 h-8 text-blue-400" />
              Purchase Orders
            </h1>
            <p className="text-gray-400 mt-2">Manage vendor purchase orders and track deliveries</p>
          </div>
          {permissions.canManagePOs && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create PO
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
              placeholder="Search by PO number or notes..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Total POs"
            value={pos?.length || 0}
            icon={<FileText className="w-6 h-6" />}
            color="text-blue-400"
          />
          <StatsCard
            title="Draft"
            value={pos?.filter(p => p.status === 'draft').length || 0}
            icon={<FileText className="w-6 h-6" />}
            color="text-yellow-400"
          />
          <StatsCard
            title="Sent"
            value={pos?.filter(p => p.status === 'sent').length || 0}
            icon={<Truck className="w-6 h-6" />}
            color="text-orange-400"
          />
          <StatsCard
            title="Received"
            value={pos?.filter(p => p.status === 'received').length || 0}
            icon={<CheckCircle className="w-6 h-6" />}
            color="text-green-400"
          />
        </div>

        {/* POs Table */}
        {isLoading ? (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <p className="text-gray-400">Loading purchase orders...</p>
          </Card>
        ) : (
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Expected Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No purchase orders found. Create your first PO to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po) => (
                      <tr key={po.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-blue-400">{po.po_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-white">{po.vendor_id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">
                            {format(new Date(po.po_date), 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">
                            {po.expected_delivery_date
                              ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-white">
                            ${((po.total_amount || 0) / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPO(po)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create PO Dialog */}
      <CreatePODialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />

      {/* View PO Dialog */}
      {selectedPO && (
        <ViewPODialog
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={color}>{icon}</div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    acknowledged: 'bg-yellow-500/20 text-yellow-400',
    received: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

function CreatePODialog({ open, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    po_number: '',
    vendor_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    line_items: [] as any[],
  });

  const createPO = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Purchase order created successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to create PO: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPO.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>PO Number *</Label>
              <Input
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="PO-2024-001"
                required
              />
            </div>
            <div>
              <Label>Vendor ID *</Label>
              <Input
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>PO Date *</Label>
              <Input
                type="date"
                value={formData.po_date}
                onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div>
              <Label>Expected Delivery</Label>
              <Input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600">
              Create Purchase Order
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewPODialog({ po, onClose, onUpdate }: any) {
  return (
    <Dialog open={!!po} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Purchase Order: {po.po_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Status</Label>
              <div className="mt-1">
                <StatusBadge status={po.status} />
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Total Amount</Label>
              <p className="text-2xl font-bold text-white mt-1">
                ${((po.total_amount || 0) / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">PO Date</Label>
              <p className="text-white mt-1">{format(new Date(po.po_date), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <Label className="text-gray-400">Expected Delivery</Label>
              <p className="text-white mt-1">
                {po.expected_delivery_date
                  ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                  : 'Not set'}
              </p>
            </div>
          </div>

          {po.notes && (
            <div>
              <Label className="text-gray-400">Notes</Label>
              <p className="text-white mt-1">{po.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
