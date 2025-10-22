import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import ElectricBorder from "@/components/ElectricBorder";
import { useState } from "react";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Search,
  BarChart3,
  AlertCircle 
} from "lucide-react";

function QuickActionCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const [isHovered, setIsHovered] = useState(false);

  const cardContent = (
    <Card 
      className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)] group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );

  if (isHovered) {
    return (
      <ElectricBorder
        color="#7df9ff"
        speed={1}
        chaos={0.5}
        thickness={2}
        style={{ borderRadius: 12 }}
      >
        {cardContent}
      </ElectricBorder>
    );
  }

  return cardContent;
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card">
        <div className="container max-w-4xl">
          <div className="text-center space-y-8">
            {/* Hero Section with Gradient */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)] bg-clip-text text-transparent">
                {APP_TITLE}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered inventory management for diesel engine parts. 
                Zero-lag performance, intelligent automation, real-time insights.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)]">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">AI Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Semantic search understands intent, not just keywords
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)]">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">PO Automation</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-match vendor acknowledgments with 80% accuracy
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)]">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Real-Time Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Live dashboards with zero-lag performance
                  </p>
                </div>
              </Card>
            </div>

            {/* CTA */}
            <div className="mt-12">
              <a href={getLoginUrl()}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)] hover:opacity-90 transition-opacity text-white font-semibold px-8 py-6 text-lg"
                >
                  Sign In to Get Started
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[oklch(0.65_0.14_135)] to-[oklch(0.7_0.16_145)] bg-clip-text text-transparent">
                {APP_TITLE}
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name || 'User'}</p>
            </div>
            <Button variant="outline" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-bold mt-1">0</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open POs</p>
                  <p className="text-3xl font-bold mt-1">0</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-3xl font-bold mt-1">0</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Vendors</p>
                  <p className="text-3xl font-bold mt-1">0</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionCard
                icon={<Search className="h-6 w-6 text-white" />}
                title="Search Products"
                description="Find parts instantly"
              />

              <QuickActionCard
                icon={<Package className="h-6 w-6 text-white" />}
                title="Update Stock"
                description="Manage inventory"
              />

              <QuickActionCard
                icon={<ShoppingCart className="h-6 w-6 text-white" />}
                title="Create PO"
                description="New purchase order"
              />
            </div>
          </div>

          {/* Status Message */}
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/30">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">System Ready</h3>
                <p className="text-sm text-muted-foreground">
                  The inventory system is configured and ready to receive data. 
                  Import your database to populate products, vendors, and purchase orders.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

