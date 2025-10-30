import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Package, Calendar, Hash, Wrench, 
  AlertTriangle, CheckCircle, Info
} from "lucide-react";
import LaserFlow from "@/components/LaserFlow";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "";

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-12 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-gray-400 mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/search">
            <Button className="bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a]">
              Back to Search
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isLowStock = (product.stock_quantity || 0) <= (product.reorder_point || 0);

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
            <Link href="/search">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Product Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-6 mb-4">
                <div>
                  <div className="inline-block bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-lg font-mono mb-4">
                    {product.sku}
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    {product.name}
                  </h1>
                  {product.application && (
                    <p className="text-xl text-gray-400">{product.application}</p>
                  )}
                </div>

                {/* Stock Status */}
                <Card className={`p-6 ${isLowStock ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} backdrop-blur-sm`}>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Stock Level</div>
                    <div className={`text-4xl font-bold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                      {product.stock_quantity || 0}
                    </div>
                    {isLowStock && (
                      <div className="flex items-center gap-1 text-red-400 text-sm mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Low Stock</span>
                      </div>
                    )}
                    {!isLowStock && (product.stock_quantity || 0) > 0 && (
                      <div className="flex items-center gap-1 text-green-400 text-sm mt-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>In Stock</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Info className="w-6 h-6 text-green-400" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {product.precision_number && (
                      <InfoField label="Precision #" value={product.precision_number} />
                    )}
                    {product.quality_number && (
                      <InfoField label="Quality #" value={product.quality_number} />
                    )}
                    {product.years && (
                      <InfoField label="Years" value={product.years} icon={<Calendar className="w-4 h-4" />} />
                    )}
                    {product.category && (
                      <InfoField label="Category" value={product.category} />
                    )}
                    {product.cast_number && (
                      <InfoField label="Cast Number" value={product.cast_number} />
                    )}
                    {product.oe_number && (
                      <InfoField label="OE Number" value={product.oe_number} />
                    )}
                  </div>
                </Card>

                {/* Components */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Package className="w-6 h-6 text-green-400" />
                    Components
                  </h2>
                  
                  <div className="space-y-4">
                    {product.driver_bellow && (
                      <ComponentRow label="Driver Bellow" value={product.driver_bellow} color="blue" />
                    )}
                    {product.passenger_bellow && (
                      <ComponentRow label="Passenger Bellow" value={product.passenger_bellow} color="blue" />
                    )}
                    {product.tie_rod_driver && (
                      <ComponentRow label="Tie Rod (Driver)" value={product.tie_rod_driver} color="purple" />
                    )}
                    {product.tie_rod_passenger && (
                      <ComponentRow label="Tie Rod (Passenger)" value={product.tie_rod_passenger} color="purple" />
                    )}
                    {product.pressure_fitting && (
                      <ComponentRow label="Pressure Fitting" value={product.pressure_fitting} color="green" />
                    )}
                    {product.return_fitting && (
                      <ComponentRow label="Return Fitting" value={product.return_fitting} color="green" />
                    )}
                    {product.o_rings && (
                      <ComponentRow label="O-Rings" value={product.o_rings} color="orange" />
                    )}
                  </div>
                </Card>

                {/* Tools & Equipment */}
                {(product.cutter || product.bushing || product.base || product.installer) && (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Wrench className="w-6 h-6 text-green-400" />
                      Tools & Equipment
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {product.cutter && <InfoField label="Cutter" value={product.cutter} />}
                      {product.bushing && <InfoField label="Bushing" value={product.bushing} />}
                      {product.base && <InfoField label="Base" value={product.base} />}
                      {product.installer && <InfoField label="Installer" value={product.installer} />}
                      {product.sleeve && <InfoField label="Sleeve" value={product.sleeve} />}
                      {product.timing && <InfoField label="Timing" value={product.timing} />}
                    </div>
                  </Card>
                )}

                {/* Comments */}
                {product.comments && (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Notes</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{product.comments}</p>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Part Classifications */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Part Classifications</h3>
                  <div className="space-y-3">
                    {product.ups && <ClassificationBadge label="UPS" value={product.ups} />}
                    {product.lps && <ClassificationBadge label="LPS" value={product.lps} />}
                    {product.mcs && <ClassificationBadge label="MCS" value={product.mcs} />}
                    {product.bhs && <ClassificationBadge label="BHS" value={product.bhs} />}
                    {product.pt_x4 && <ClassificationBadge label="PT X 4" value={product.pt_x4} />}
                    {product.ppt && <ClassificationBadge label="PPT" value={product.ppt} />}
                  </div>
                </Card>

                {/* Measurements */}
                {(product.turns || product.oal) && (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Measurements</h3>
                    <div className="space-y-3">
                      {product.turns && <InfoField label="Turns" value={product.turns} />}
                      {product.oal && <InfoField label="OAL" value={product.oal} />}
                    </div>
                  </Card>
                )}

                {/* Actions */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a]">
                      Update Stock
                    </Button>
                    <Button variant="outline" className="w-full bg-white/5 border-white/20">
                      Edit Product
                    </Button>
                    <Button variant="outline" className="w-full bg-white/5 border-white/20">
                      View History
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper Components
function InfoField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-white font-medium">{value}</div>
    </div>
  );
}

function ComponentRow({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
      <span className="text-gray-400">{label}</span>
      <span className={`px-3 py-1 rounded-md text-sm font-mono border ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </span>
    </div>
  );
}

function ClassificationBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <Badge variant="outline" className="bg-white/5 border-white/20 text-white font-mono">
        {value}
      </Badge>
    </div>
  );
}

