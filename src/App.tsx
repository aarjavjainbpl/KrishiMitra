import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RoleGuard } from './components/RoleGuard';

// Pages
import { MandiRatesPage } from './pages/MandiRatesPage';
import { PricePredictorPage } from './pages/PricePredictorPage';
import { QualityPredictorPage } from './pages/QualityPredictorPage';
import { RouteOptimizerPage } from './pages/RouteOptimizerPage';
import { BuyerBrowsePage } from './pages/BuyerBrowsePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { FarmerDashboardPage } from './pages/FarmerDashboardPage';
import { HarvestPlacementPage } from './pages/HarvestPlacementPage';
import { OrdersPage } from './pages/OrdersPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Root Router: Checks login state and routes user to their specific workspace
const RootHandler: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'farmer') {
    return <Navigate to="/farmer/place-harvest" replace />;
  }
  return <Navigate to="/buyer/browse" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
          {/* Top Bar is automatically hidden for unauthenticated users / login page and isolated per role */}
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Home & Initial Entry Gate */}
              <Route path="/" element={<RootHandler />} />

              {/* Farmer-Specific Routes (Protected: Only Farmer) */}
              <Route
                path="/farmer/place-harvest"
                element={
                  <RoleGuard allowedRoles={['farmer']}>
                    <HarvestPlacementPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/place-harvest"
                element={
                  <RoleGuard allowedRoles={['farmer']}>
                    <HarvestPlacementPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/farmer/dashboard"
                element={
                  <RoleGuard allowedRoles={['farmer']}>
                    <FarmerDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/quality-predictor"
                element={
                  <RoleGuard allowedRoles={['farmer']}>
                    <QualityPredictorPage />
                  </RoleGuard>
                }
              />

              {/* Buyer-Specific Routes (Protected: Only Buyer) */}
              <Route
                path="/buyer/browse"
                element={
                  <RoleGuard allowedRoles={['buyer']}>
                    <BuyerBrowsePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/listing/:id"
                element={
                  <RoleGuard allowedRoles={['buyer']}>
                    <ListingDetailPage />
                  </RoleGuard>
                }
              />

              {/* Logistics & Route Optimizer (Buyer & Farmer) */}
              <Route
                path="/route-optimizer"
                element={
                  <RoleGuard allowedRoles={['buyer', 'farmer']}>
                    <RouteOptimizerPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/farmer/route-optimizer"
                element={
                  <RoleGuard allowedRoles={['farmer', 'buyer']}>
                    <RouteOptimizerPage />
                  </RoleGuard>
                }
              />

              {/* Shared Market Feeds & Price Trends (Protected) */}
              <Route
                path="/mandi-rates"
                element={
                  <RoleGuard allowedRoles={['farmer', 'buyer']}>
                    <MandiRatesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/price-predictor"
                element={
                  <RoleGuard allowedRoles={['farmer', 'buyer']}>
                    <PricePredictorPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/orders"
                element={
                  <RoleGuard allowedRoles={['farmer', 'buyer']}>
                    <OrdersPage />
                  </RoleGuard>
                }
              />

              {/* Auth / Work Selection */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Minimal Clean Platform Status Footer */}
          <footer className="bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8 mt-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-700">Mandi Server: Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="font-bold text-slate-700">Escrow Payouts: Secured</span>
                </div>
              </div>
              <p className="font-medium text-slate-400">
                KrishiMitra • Direct Farm-to-Buyer Digital Architecture (SIH26033)
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
