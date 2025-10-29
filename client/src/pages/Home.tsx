import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Search, Box, FileText, Users, Edit, BarChart3, Download, ClipboardList } from "lucide-react";
import { Link, useLocation } from "wouter";
import LaserFlow from "@/components/LaserFlow";
import ElectricBorder from "@/components/ElectricBorder";

export default function Home() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const permissions = usePermissions();
  const isAuthenticated = !!user;
  
  // Fetch product stats
  const { data: stats, isLoading: statsLoading } = trpc.products.stats.useQuery();
  
  // Fetch recent products
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 10 });

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
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{APP_TITLE}</h1>
              {isAuthenticated && user && (
                <p className="text-sm text-gray-400">Welcome back, {user.name}</p>
              )}
            </div>
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="bg-white/5 border-white/20 hover:bg-white/10"
                onClick={() => signOut().then(() => setLocation('/login'))}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={() => setLocation('/login')}
                className="bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a] hover:from-[#6aa835] hover:to-[#4a8520]"
              >
                Sign In
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          {/* Dashboard Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Products"
                value={statsLoading ? "..." : stats?.total.toLocaleString() || "0"}
                icon={<Package className="w-6 h-6" />}
                iconColor="text-green-400"
              />
              <StatCard
                title="Open POs"
                value="0"
                icon={<ShoppingCart className="w-6 h-6" />}
                iconColor="text-blue-400"
              />
              <StatCard
                title="Low Stock Items"
                value={statsLoading ? "..." : stats?.lowStock.toLocaleString() || "0"}
                icon={<AlertTriangle className="w-6 h-6" />}
                iconColor="text-red-400"
              />
              <StatCard
                title="Active Vendors"
                value="0"
                icon={<TrendingUp className="w-6 h-6" />}
                iconColor="text-purple-400"
              />
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Quick Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <Link href="/search">
                <QuickActionCard
                  title="Search Products"
                  description="Find parts instantly"
                  icon={<Search className="w-8 h-8" />}
                />
              </Link>
              {permissions.canEditProducts && (
                <Link href="/products">
                  <QuickActionCard
                    title="Manage Products"
                    description="Add, edit products"
                    icon={<Edit className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canUpdateStock && (
                <Link href="/stock">
                  <QuickActionCard
                    title="Update Stock"
                    description="Manage inventory"
                    icon={<Box className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canViewPOs && (
                <Link href="/purchase-orders">
                  <QuickActionCard
                    title="Purchase Orders"
                    description="Manage vendor POs"
                    icon={<FileText className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canManageUsers && (
                <Link href="/users">
                  <QuickActionCard
                    title="User Management"
                    description="Manage roles"
                    icon={<Users className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canViewAnalytics && (
                <Link href="/analytics">
                  <QuickActionCard
                    title="Analytics"
                    description="View reports"
                    icon={<BarChart3 className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canExportData && (
                <Link href="/export">
                  <QuickActionCard
                    title="Export Data"
                    description="Download CSV/JSON"
                    icon={<Download className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canFillForms && (
                <Link href="/forms">
                  <QuickActionCard
                    title="Forms"
                    description="Fill custom forms"
                    icon={<ClipboardList className="w-8 h-8" />}
                  />
                </Link>
              )}
              {permissions.canManageForms && (
                <Link href="/forms-admin">
                  <QuickActionCard
                    title="Form Templates"
                    description="Manage form templates"
                    icon={<FileText className="w-8 h-8" />}
                  />
                </Link>
              )}
            </div>
          </section>

          {/* Recent Products */}
          {!productsLoading && products && products.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Recent Products</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* System Status */}
          <section className="mt-12">
            <Card className="bg-white/5 border-green-500/30 backdrop-blur-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">System Ready</h3>
                  <p className="text-gray-400 text-sm">
                    The inventory system is configured and ready. {stats?.total.toLocaleString() || 0} products loaded from database.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, iconColor }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  iconColor: string;
}) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Quick Action Card Component with Electric Border
function QuickActionCard({ title, description, icon }: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ElectricBorder
          color="#7FBF3F"
          speed={1}
          chaos={0.5}
          thickness={2}
          style={{ borderRadius: 12 }}
        >
          <Card className="bg-white/5 border-transparent backdrop-blur-sm p-6 cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center flex-shrink-0 text-green-400">
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
              </div>
            </div>
          </Card>
        </ElectricBorder>
      </div>
      
      <div className="opacity-100 group-hover:opacity-0 transition-opacity duration-300 absolute inset-0">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 cursor-pointer h-full hover:bg-white/10 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center flex-shrink-0 text-green-400">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product }: { product: any }) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 hover:bg-white/10 transition-all">
      <div className="mb-4">
        <div className="text-xs text-green-400 font-mono mb-2">{product.sku}</div>
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{product.name}</h3>
        {product.application && (
          <p className="text-sm text-gray-400 mb-2">{product.application}</p>
        )}
        {product.years && (
          <p className="text-xs text-gray-500">Years: {product.years}</p>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400">
          Stock: <span className="text-white font-semibold">{product.stock_quantity || 0}</span>
        </div>
        <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-500/10">
          View Details
        </Button>
      </div>
    </Card>
  );
}

