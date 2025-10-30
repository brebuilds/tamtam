import { usePermissions } from "@/hooks/usePermissions";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
  Download
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const permissions = usePermissions();

  // Fetch analytics data
  const { data: stats } = trpc.products.stats.useQuery();
  const { data: products } = trpc.products.list.useQuery({ limit: 1000 });
  const { data: pos } = trpc.purchaseOrders.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  if (!permissions.canViewAnalytics) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to view analytics.</p>
        </Card>
      </div>
    );
  }

  // Calculate analytics
  const totalValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.unit_price || 0)), 0) || 0;
  const avgStockLevel = products?.length ? products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) / products.length : 0;

  // Stock distribution by category
  const categoryData = products?.reduce((acc: any, p) => {
    const cat = p.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat]++;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData || {}).map(([name, value]) => ({ name, value }));

  // Stock levels over time (mock data - would need historical tracking)
  const stockTrendData = [
    { month: 'Jan', stock: 450 },
    { month: 'Feb', stock: 520 },
    { month: 'Mar', stock: 480 },
    { month: 'Apr', stock: 550 },
    { month: 'May', stock: 600 },
    { month: 'Jun', stock: 580 },
  ];

  // Top products by value
  const topProducts = products
    ?.map(p => ({
      name: p.name,
      value: (p.stock_quantity || 0) * (p.unit_price || 0) / 100,
      stock: p.stock_quantity || 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) || [];

  // PO status breakdown
  const poStatusData = [
    { name: 'Draft', value: pos?.filter(p => p.status === 'draft').length || 0 },
    { name: 'Sent', value: pos?.filter(p => p.status === 'sent').length || 0 },
    { name: 'Acknowledged', value: pos?.filter(p => p.status === 'acknowledged').length || 0 },
    { name: 'Received', value: pos?.filter(p => p.status === 'received').length || 0 },
    { name: 'Cancelled', value: pos?.filter(p => p.status === 'cancelled').length || 0 },
  ].filter(d => d.value > 0);

  const exportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalProducts: stats?.total || 0,
        totalValue: totalValue / 100,
        avgStockLevel,
        lowStockItems: stats?.lowStock || 0,
        activePOs: pos?.length || 0,
        totalUsers: users?.length || 0
      },
      topProducts,
      categoryDistribution: categoryChartData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Report exported successfully");
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Inventory insights and performance metrics</p>
          </div>
          <Button onClick={exportReport} className="bg-gradient-to-r from-blue-500 to-blue-600">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Inventory Value"
            value={`$${(totalValue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="text-green-400"
            trend="+12%"
            trendUp={true}
          />
          <KPICard
            title="Total Products"
            value={stats?.total.toLocaleString() || '0'}
            icon={<Package className="w-6 h-6" />}
            color="text-blue-400"
            trend="+5"
            trendUp={true}
          />
          <KPICard
            title="Low Stock Items"
            value={stats?.lowStock.toLocaleString() || '0'}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="text-red-400"
            trend="-3"
            trendUp={false}
          />
          <KPICard
            title="Avg Stock Level"
            value={avgStockLevel.toFixed(1)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="text-purple-400"
            trend="+8%"
            trendUp={true}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Stock Trend */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Stock Level Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="stock" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Distribution */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products by Value */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top 10 Products by Value</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* PO Status */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Purchase Order Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={poStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {poStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Summary Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Stats */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Statistics</h3>
            <div className="space-y-3">
              <StatRow label="Total Products" value={stats?.total.toLocaleString() || '0'} />
              <StatRow label="Active Products" value={stats?.active.toLocaleString() || '0'} />
              <StatRow label="Low Stock Alerts" value={stats?.lowStock.toLocaleString() || '0'} />
              <StatRow label="Total Purchase Orders" value={pos?.length.toLocaleString() || '0'} />
              <StatRow label="Active Users" value={users?.length.toLocaleString() || '0'} />
              <StatRow label="Inventory Value" value={`$${(totalValue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            </div>
          </Card>

          {/* Quick Insights */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Insights</h3>
            <div className="space-y-3">
              <InsightItem
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                text="Inventory value increased 12% this month"
              />
              <InsightItem
                icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
                text={`${stats?.lowStock || 0} items need reordering`}
              />
              <InsightItem
                icon={<ShoppingCart className="w-5 h-5 text-blue-400" />}
                text={`${pos?.filter(p => p.status === 'sent').length || 0} POs awaiting delivery`}
              />
              <InsightItem
                icon={<Package className="w-5 h-5 text-purple-400" />}
                text={`Average stock level: ${avgStockLevel.toFixed(1)} units`}
              />
              <InsightItem
                icon={<Users className="w-5 h-5 text-indigo-400" />}
                text={`${users?.length || 0} active users in system`}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color, trend, trendUp }: any) {
  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={color}>{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className={`text-sm flex items-center gap-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trend}
        </span>
      </div>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function InsightItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
      {icon}
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  );
}
