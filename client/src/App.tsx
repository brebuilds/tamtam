import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import NewsFeed from "./pages/NewsFeed";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import StockManagement from "./pages/StockManagement";
import ProductManagement from "./pages/ProductManagement";
import PurchaseOrders from "./pages/PurchaseOrders";
import UserManagement from "./pages/UserManagement";
import Analytics from "./pages/Analytics";
import DataExport from "./pages/DataExport";
import Forms from "./pages/Forms";
import FormsAdmin from "./pages/FormsAdmin";
import Login from "./pages/Login";
import KnowledgeHub from "./pages/KnowledgeHub";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path={"/"} component={NewsFeed} />
      <Route path="/knowledge-hub" component={KnowledgeHub} />
      <Route path="/search" component={Search} />
      <Route path="/stock" component={StockManagement} />
      <Route path="/products" component={ProductManagement} />
      <Route path="/purchase-orders" component={PurchaseOrders} />
      <Route path="/users" component={UserManagement} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/export" component={DataExport} />
      <Route path="/forms" component={Forms} />
      <Route path="/forms-admin" component={FormsAdmin} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
