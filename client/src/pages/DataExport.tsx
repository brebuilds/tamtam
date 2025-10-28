import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText, Database, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function DataExport() {
  const permissions = usePermissions();
  const [selectedTables, setSelectedTables] = useState<string[]>(['products']);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const { data: products } = trpc.products.list.useQuery({ limit: 10000 });
  const { data: pos } = trpc.purchaseOrders.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  if (!permissions.canExportData) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to export data.</p>
        </Card>
      </div>
    );
  }

  const tables = [
    { id: 'products', name: 'Products', count: products?.length || 0, description: 'All product data with specifications' },
    { id: 'purchaseOrders', name: 'Purchase Orders', count: pos?.length || 0, description: 'PO history and status' },
    { id: 'users', name: 'Users', count: users?.length || 0, description: 'User accounts and roles' },
  ];

  const toggleTable = (tableId: string) => {
    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter(t => t !== tableId));
    } else {
      setSelectedTables([...selectedTables, tableId]);
    }
  };

  const convertToCSV = (data: any[], headers: string[]) => {
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (value === null || value === undefined) return '';
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error("Please select at least one table to export");
      return;
    }

    setIsExporting(true);

    try {
      const exportData: any = {};

      if (selectedTables.includes('products') && products) {
        exportData.products = products;
      }
      if (selectedTables.includes('purchaseOrders') && pos) {
        exportData.purchaseOrders = pos;
      }
      if (selectedTables.includes('users') && users) {
        exportData.users = users;
      }

      if (exportFormat === 'json') {
        // JSON Export
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tamerx-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported as JSON successfully");
      } else {
        // CSV Export - create separate files for each table
        for (const [tableName, data] of Object.entries(exportData)) {
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const csv = convertToCSV(data, headers);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
        toast.success(`Exported ${selectedTables.length} table(s) as CSV`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Download className="w-8 h-8 text-green-400" />
            Data Export
          </h1>
          <p className="text-gray-400 mt-2">Export your inventory data for backup or analysis</p>
        </div>

        {/* Export Format */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Select Export Format
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <div className="font-semibold text-white mb-1">CSV (Comma Separated)</div>
                <div className="text-sm text-gray-400">
                  Best for Excel, Google Sheets. Separate file per table.
                </div>
              </div>
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                exportFormat === 'json'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <div className="font-semibold text-white mb-1">JSON</div>
                <div className="text-sm text-gray-400">
                  Best for data migration, API integration. Single file.
                </div>
              </div>
            </button>
          </div>
        </Card>

        {/* Table Selection */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Select Tables to Export
          </h3>
          <div className="space-y-3">
            {tables.map(table => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedTables.includes(table.id)
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => toggleTable(table.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedTables.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{table.name}</span>
                      <span className="text-sm text-gray-400">{table.count} records</span>
                    </div>
                    <p className="text-sm text-gray-400">{table.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Export Summary */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Export Summary</h3>
          <div className="space-y-2 text-gray-300">
            <div className="flex items-center justify-between">
              <span>Format:</span>
              <span className="font-semibold text-white uppercase">{exportFormat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tables:</span>
              <span className="font-semibold text-white">{selectedTables.length} selected</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Records:</span>
              <span className="font-semibold text-white">
                {tables
                  .filter(t => selectedTables.includes(t.id))
                  .reduce((sum, t) => sum + t.count, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || selectedTables.length === 0}
          className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </>
          )}
        </Button>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/30 p-6 mt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white mb-2">Export Tips</h4>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>CSV files can be opened directly in Excel or Google Sheets</li>
                <li>JSON format preserves all data types and nested structures</li>
                <li>Large exports may take a few moments to download</li>
                <li>Exported data includes all fields from selected tables</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
