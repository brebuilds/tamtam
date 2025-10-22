import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Package, Calendar, Hash, AlertCircle, Sparkles, Zap } from "lucide-react";
import { Link } from "wouter";
import LaserFlow from "@/components/LaserFlow";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [useAI, setUseAI] = useState(true);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  // Regular SQL search
  const { data: sqlProducts, isLoading: sqlLoading } = trpc.products.search.useQuery(
    { query: debouncedQuery, limit: 50 },
    { enabled: debouncedQuery.length > 0 && !useAI }
  );

  // AI semantic search
  const { data: aiResults, isLoading: aiLoading } = trpc.products.semanticSearch.useQuery(
    { query: debouncedQuery, limit: 20 },
    { enabled: debouncedQuery.length > 0 && useAI }
  );

  const products = useAI ? aiResults?.map(r => r.product) : sqlProducts;
  const isLoading = useAI ? aiLoading : sqlLoading;

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
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Search Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Search Products
              </h1>
              <p className="text-gray-400 text-lg">
                Find steering rack components instantly
              </p>
            </div>

            {/* AI Toggle */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant={useAI ? "default" : "outline"}
                onClick={() => setUseAI(true)}
                className={useAI ? "bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a]" : "bg-white/5 border-white/20"}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Search
              </Button>
              <Button
                variant={!useAI ? "default" : "outline"}
                onClick={() => setUseAI(false)}
                className={!useAI ? "bg-gradient-to-r from-[#7FBF3F] to-[#5a9e2a]" : "bg-white/5 border-white/20"}
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Search
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative mb-8">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by SKU, application, part number, or vehicle..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            {/* Search Results */}
            {searchQuery.length > 0 && (
              <div className="space-y-4">
                {isLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Searching...</p>
                  </div>
                )}

                {!isLoading && products && products.length === 0 && (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                    <p className="text-gray-400">
                      Try searching with different keywords or part numbers
                    </p>
                  </Card>
                )}

                {!isLoading && products && products.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-gray-400">
                        Found <span className="text-white font-semibold">{products.length}</span> results
                      </p>
                    </div>

                    <div className="space-y-4">
                      {products.map((product, idx) => {
                        const aiResult = useAI ? aiResults?.[idx] : null;
                        return (
                          <div key={product.id}>
                            <ProductSearchResult product={product} />
                            {aiResult && aiResult.reasoning && (
                              <Card className="bg-purple-500/10 border-purple-500/30 backdrop-blur-sm p-3 mt-2 ml-4">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm text-purple-200">
                                      <span className="font-semibold">AI Match ({aiResult.relevanceScore}%):</span> {aiResult.reasoning}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Empty State */}
            {searchQuery.length === 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-12 text-center">
                <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Start searching</h3>
                <p className="text-gray-400 mb-6">
                  Enter a SKU, part number, vehicle application, or year range
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => handleSearch("GM")}
                  >
                    GM Parts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => handleSearch("Mazda")}
                  >
                    Mazda
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => handleSearch("BT-")}
                  >
                    Bellows
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => handleSearch("TR-")}
                  >
                    Tie Rods
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Product Search Result Component
function ProductSearchResult({ product }: { product: any }) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 hover:bg-white/10 hover:border-green-500/30 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            {/* SKU Badge */}
            <div className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-mono mb-3">
              {product.sku}
            </div>

            {/* Product Name */}
            <h3 className="text-xl font-semibold text-white mb-2">
              {product.name}
            </h3>

            {/* Application */}
            {product.application && (
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Package className="w-4 h-4" />
                <span>{product.application}</span>
              </div>
            )}

            {/* Years */}
            {product.years && (
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Years: {product.years}</span>
              </div>
            )}

            {/* Part Numbers */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {product.precision_number && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Hash className="w-3 h-3" />
                  <span>Precision: {product.precision_number}</span>
                </div>
              )}
              {product.quality_number && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Hash className="w-3 h-3" />
                  <span>Quality: {product.quality_number}</span>
                </div>
              )}
            </div>

            {/* Components */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.driver_bellow && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  Bellow: {product.driver_bellow}
                </span>
              )}
              {product.tie_rod_driver && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                  Tie Rod: {product.tie_rod_driver}
                </span>
              )}
              {product.o_rings && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                  O-Rings
                </span>
              )}
            </div>
          </div>

          {/* Stock Info */}
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Stock</div>
            <div className={`text-2xl font-bold ${
              (product.stock_quantity || 0) > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {product.stock_quantity || 0}
            </div>
            {product.reorder_point && product.stock_quantity <= product.reorder_point && (
              <div className="text-xs text-red-400 mt-1">Low Stock</div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

