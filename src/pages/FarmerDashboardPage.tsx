import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Package,
  TrendingUp,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  Truck,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Calendar,
  X
} from 'lucide-react';
import { Listing, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { FairPriceBadge } from '../components/FairPriceBadge';
import { fallbackListings, fallbackOrders } from '../data/fallbackData';

export const FarmerDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Listing Modal State
  const [showModal, setShowModal] = useState<boolean>(
    searchParams.get('openListingModal') === 'true'
  );

  // Form Fields
  const [cropName, setCropName] = useState<string>('Tomato');
  const [variety, setVariety] = useState<string>('Desi Hybrid (Red)');
  const [quantityKg, setQuantityKg] = useState<number>(2000);
  const [askingPricePerKg, setAskingPricePerKg] = useState<number>(24);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [qualityPredictionId, setQualityPredictionId] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(
    'Freshly harvested, hand-picked grade produce. High firmness and balanced acidity.'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
  );
  const [creating, setCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);

  // Live Mandi benchmark price lookup helper for the modal
  const [liveMandiPrice, setLiveMandiPrice] = useState<number>(22);

  // Check prefill data from Quality Predictor (Module C)
  useEffect(() => {
    const prefill = localStorage.getItem('krishimitra_prefill_listing') || localStorage.getItem('agriconnect_prefill_listing');
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        if (data.cropName) setCropName(data.cropName);
        if (data.qualityGrade) setQualityGrade(data.qualityGrade);
        if (data.qualityPredictionId) setQualityPredictionId(data.qualityPredictionId);
        if (data.photoUrl) setPhotoUrl(data.photoUrl);
        setShowModal(true);
        // Clear after reading
        localStorage.removeItem('krishimitra_prefill_listing');
        localStorage.removeItem('agriconnect_prefill_listing');
      } catch (e) {
        console.error('Error parsing prefill:', e);
      }
    }
  }, []);

  // Fetch farmer data
  const fetchData = async () => {
    try {
      setLoading(true);
      let loadedListings: Listing[] = [];

      // Fetch listings from backend
      try {
        const res = await fetch('/api/listings');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.listings && data.listings.length > 0) {
            loadedListings = data.listings;
          }
        }
      } catch (networkErr) {
        console.warn('Backend listings fetch issue, checking local storage:', networkErr);
      }

      if (loadedListings.length === 0) {
        loadedListings = [...fallbackListings];
      }

      // Merge locally published harvests so any harvest published via "Sell Harvest" or Farmer Hub appears immediately
      try {
        const localSaved: Listing[] = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        if (localSaved.length > 0) {
          const existingIds = new Set(loadedListings.map(l => l.id));
          const newItems = localSaved.filter(item => !existingIds.has(item.id));
          loadedListings = [...newItems, ...loadedListings];
        }
      } catch {
        // Non-blocking
      }

      setListings(loadedListings);

      // Fetch incoming orders
      const ordRes = await fetch('/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      const ordContentType = ordRes.headers.get('content-type') || '';
      if (ordRes.ok && ordContentType.includes('application/json')) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || fallbackOrders);
      } else {
        setOrders(fallbackOrders);
      }

      // Fetch live mandi modal reference
      const mRes = await fetch(`/api/mandi-rates?crop=${cropName}`);
      const mContentType = mRes.headers.get('content-type') || '';
      if (mRes.ok && mContentType.includes('application/json')) {
        const mData = await mRes.json();
        if (mData.rates && mData.rates.length > 0) {
          const avg = mData.rates.reduce((sum: number, r: any) => sum + r.modalPrice, 0) / mData.rates.length;
          setLiveMandiPrice(Math.round(avg * 10) / 10);
        }
      }
    } catch (e) {
      console.warn('Error fetching farmer dashboard, using fallbacks:', e);
      // Merge fallback with local listings
      let fallbackCombined = [...fallbackListings];
      try {
        const localSaved: Listing[] = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        if (localSaved.length > 0) {
          const existingIds = new Set(fallbackCombined.map(l => l.id));
          const newItems = localSaved.filter(item => !existingIds.has(item.id));
          fallbackCombined = [...newItems, ...fallbackCombined];
        }
      } catch {
        // Non-blocking
      }
      setListings(fallbackCombined);
      setOrders(fallbackOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for cross-component harvest publishing updates
    const handleListingsUpdate = () => {
      fetchData();
    };

    window.addEventListener('krishimitra_listings_updated', handleListingsUpdate);
    window.addEventListener('storage', handleListingsUpdate);

    return () => {
      window.removeEventListener('krishimitra_listings_updated', handleListingsUpdate);
      window.removeEventListener('storage', handleListingsUpdate);
    };
  }, [cropName]);

  // VRP Route Optimization & Buyer Notification Modal State
  const [vrpModal, setVrpModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    clusterInfo: any;
  }>({
    isOpen: false,
    order: null,
    clusterInfo: null,
  });

  // Handle Order Status Progression
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, targetOrder?: Order) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchData();

        if (newStatus === 'ready_for_pickup') {
          setVrpModal({
            isOpen: true,
            order: targetOrder || data.order,
            clusterInfo: data.clusterInfo,
          });
        }
      }
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  // Handle Create Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({
          cropName,
          variety,
          quantityKg: Number(quantityKg),
          askingPricePerKg: Number(askingPricePerKg),
          qualityGrade,
          qualityPredictionId: qualityPredictionId || undefined,
          harvestDate,
          description,
          photoUrl,
          farmerLat: user?.locationLat || 19.9975,
          farmerLng: user?.locationLng || 73.7898,
        }),
      });

      let createdItem: Listing | null = null;
      if (res.ok) {
        const data = await res.json();
        createdItem = data.listing;
      }

      if (!createdItem) {
        createdItem = {
          id: `list-${Date.now()}`,
          farmerId: user?.id || 'user-farmer-1',
          farmerName: user?.name || 'Rameshwar Patidar',
          farmerPhone: user?.phone || '+91 98260 12345',
          farmerLocation: user?.district ? `${user.district}, Madhya Pradesh` : 'Phanda Khurd, Bhopal, Madhya Pradesh',
          locationLat: user?.locationLat || 23.235,
          locationLng: user?.locationLng || 77.295,
          cropName,
          variety,
          quantityKg: Number(quantityKg),
          qualityGrade,
          qualityPredictionId: qualityPredictionId || undefined,
          askingPricePerKg: Number(askingPricePerKg),
          harvestDate,
          status: 'active',
          description,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
        };
      }

      // Persist to local listings storage so it never disappears on serverless refresh
      try {
        const existing = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        existing.unshift(createdItem);
        localStorage.setItem('krishimitra_local_listings', JSON.stringify(existing));
        window.dispatchEvent(new Event('krishimitra_listings_updated'));
      } catch {
        // Non-blocking
      }

      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowModal(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      console.warn('Backend issue, creating local listing:', err);
      const fallbackItem: Listing = {
        id: `list-${Date.now()}`,
        farmerId: user?.id || 'user-farmer-1',
        farmerName: user?.name || 'Rameshwar Patidar',
        farmerPhone: user?.phone || '+91 98260 12345',
        farmerLocation: user?.district ? `${user.district}, Madhya Pradesh` : 'Phanda Khurd, Bhopal, Madhya Pradesh',
        locationLat: user?.locationLat || 23.235,
        locationLng: user?.locationLng || 77.295,
        cropName,
        variety,
        quantityKg: Number(quantityKg),
        qualityGrade,
        qualityPredictionId: qualityPredictionId || undefined,
        askingPricePerKg: Number(askingPricePerKg),
        harvestDate,
        status: 'active',
        description,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        existing.unshift(fallbackItem);
        localStorage.setItem('krishimitra_local_listings', JSON.stringify(existing));
        window.dispatchEvent(new Event('krishimitra_listings_updated'));
      } catch {
        // Non-blocking
      }
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowModal(false);
        fetchData();
      }, 1200);
    } finally {
      setCreating(false);
    }
  };

  // Financial Stats
  const totalVolumeKg = listings.reduce((sum, l) => sum + l.quantityKg, 0);
  const pendingOrders = orders.filter((o) => o.status !== 'delivered');
  const escrowHeldTotal = orders
    .filter((o) => o.paymentStatus === 'held')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalEarningsPaid = orders
    .filter((o) => o.paymentStatus === 'released')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              Farmer Control Console
            </span>
            <span className="text-xs text-slate-500">
              Logged in as: <strong className="text-slate-800">{user?.name || 'Kisan Ramesh Patil'}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Farmer Dashboard & Produce Dispatch
          </h1>
        </div>

        {/* Action Buttons: Simplified Harvest Hub & Modal & Route Optimizer */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/farmer/route-optimizer"
            id="go-to-route-optimizer-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xs transition-all active:scale-98"
          >
            <Truck className="w-4 h-4 text-slate-950" />
            <span>AI Route Optimizer</span>
          </Link>
          <Link
            to="/farmer/place-harvest"
            id="go-to-place-harvest-page"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-98"
          >
            <span className="text-lg">🌾</span>
            <span>Place Harvest & Direct Orders</span>
          </Link>
          <button
            id="open-create-listing-modal-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Modal</span>
          </button>
        </div>
      </div>

      {/* 4 Feature Module Quick Launch Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Link
          to="/mandi-rates"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module A</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">Live Mandi Rates</p>
          <p className="text-xs text-slate-500 mt-0.5">Check official Agmarknet wholesale rates</p>
        </Link>

        <Link
          to="/price-predictor"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module B</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">AI Price Predictor</p>
          <p className="text-xs text-slate-500 mt-0.5">Forecast 7-30 day sell vs hold price</p>
        </Link>

        <Link
          to="/quality-predictor"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module C</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">AI Quality Grader</p>
          <p className="text-xs text-slate-500 mt-0.5">Upload produce photo for certified grade</p>
        </Link>

        <Link
          to="/route-optimizer"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module D</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">Route Optimizer</p>
          <p className="text-xs text-slate-500 mt-0.5">Optimal multi-stop pickup logistics</p>
        </Link>
      </div>

      {/* Financial KPIs - Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Escrow Protected Balance (In-Transit)
          </p>
          <p className="text-3xl font-black text-emerald-700 mt-2 font-mono">
            ₹{escrowHeldTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Guaranteed held in smart escrow</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Settled Bank Payouts
          </p>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalEarningsPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Direct Bank Account Transfer</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Active Harvest Listed
          </p>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {totalVolumeKg.toLocaleString()} kg
          </p>
          <p className="text-xs text-slate-500 mt-1">{listings.length} Active Market Listings</p>
        </div>
      </div>

      {/* Dedicated AI Route Logistics & Farm Pickup Section */}
      <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Truck className="w-3.5 h-3.5" /> Module D: AI Route Optimizer
              </span>
              <span className="bg-white/10 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full border border-white/10">
                OSRM Road Matrix & VRP Solver
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Multi-Farmer Pickup & Consolidated Route Logistics
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Consolidate farm pickup orders with nearby farmers in Bhopal (Phanda, Berasia, Sehore, Mandideep) to slash transport freight by ~28%. Calculate live road distance, GPS waypoint sequencing, and estimated truck arrival times.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-amber-400 font-black">⚡ Real-time OSRM</span>
                <span className="text-slate-400">Actual Road Routing</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-emerald-400 font-black">📉 ~28% Cost Cut</span>
                <span className="text-slate-400">Vehicle Multi-Stop Bundling</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-blue-400 font-black">📍 6 Hubs</span>
                <span className="text-slate-400">Karond, Berasia, Sehore</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              to="/farmer/route-optimizer"
              id="dashboard-open-route-optimizer"
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
            >
              <Truck className="w-4 h-4" />
              <span>Open AI Route Optimizer</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/farmer/route-optimizer?autoOptimize=true"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Solve Ready Pickups</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section: Incoming Buyer Orders (Fulfillment Workflow) */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Incoming Direct Buyer Orders ({orders.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage order confirmation, packing, and dispatch progression
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
            {pendingOrders.length} Active Pickups
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {orders.length > 0 ? (
            orders.map((ord) => (
              <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">
                      {ord.cropName} ({ord.quantityKg.toLocaleString()} kg)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'ready_for_pickup'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      Status: {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Buyer: <strong className="text-slate-800">{ord.buyerName}</strong> • Delivery:{' '}
                    <span className="text-slate-500">{ord.deliveryAddress}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="font-mono font-bold text-emerald-700">
                      Total: ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Escrow: <strong className="text-slate-700">{ord.paymentStatus}</strong>
                    </span>
                  </div>
                </div>

                {/* Workflow Action Progression */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {ord.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}

                  {ord.status === 'ready_for_pickup' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'in_transit')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" /> Mark Dispatched (In Transit)
                    </button>
                  )}

                  {ord.status === 'in_transit' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery
                    </button>
                  )}

                  {ord.status === 'delivered' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Delivered & Settled
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No orders placed yet. As buyers place orders, they will appear here.
            </div>
          )}
        </div>
      </div>

      {/* Section: Active Listings */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            My Published Harvest Listings ({listings.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-slate-100">
                  <img
                    src={item.photoUrl}
                    alt={item.cropName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        item.qualityGrade === 'A'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-teal-600 text-white'
                      }`}
                    >
                      Grade {item.qualityGrade}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{item.cropName}</h3>
                      <p className="text-xs text-slate-500">{item.variety}</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-700 font-mono">
                      ₹{item.askingPricePerKg.toFixed(1)}/kg
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>📦 Quantity: <strong>{item.quantityKg.toLocaleString()} kg</strong></p>
                    <p>📍 Location: {item.farmerLocation}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <FairPriceBadge score={item.fairPriceScore || 92} size="sm" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Status: <strong className="text-emerald-700">Active</strong></span>
                <Link
                  to={`/buyer/listing/${item.id}`}
                  className="font-bold text-emerald-700 hover:text-emerald-800"
                >
                  View Public Listing &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW LISTING MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Publish New Farm Produce Listing
                </h3>
                <p className="text-xs text-slate-500">
                  Direct listing to verified wholesale buyers without intermediary cuts
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateListing} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Crop & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Commodity / Crop Name *
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Green Chilli', 'Banana', 'Soybean', 'Mustard'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Variety / Hybrid *
                  </label>
                  <input
                    type="text"
                    required
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Desi Hybrid, Red Onion"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quantity & Asking Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity Available (KG) *
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Asking Price (₹/KG) *
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Mandi Avg: ₹{liveMandiPrice}/kg
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    required
                    value={askingPricePerKg}
                    onChange={(e) => setAskingPricePerKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-emerald-700 font-mono focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quality Grade & Module C integration */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Produce Quality Grade *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      navigate('/quality-predictor');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Grade via AI Vision (Module C)
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['A', 'B', 'C'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setQualityGrade(g)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        qualityGrade === g
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Grade {g} {g === 'A' ? '(Top Tier)' : g === 'B' ? '(Standard)' : '(Processing)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo URL / Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produce Photo URL
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harvest Notes & Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {createSuccess ? (
                <div className="p-3 bg-emerald-500 text-white rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Listing Published Successfully!
                </div>
              ) : (
                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-new-listing-btn"
                    type="submit"
                    disabled={creating}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{creating ? 'Publishing...' : 'Publish to Marketplace'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* VRP LOGISTICS & BUYER NOTIFICATION MODAL */}
      {vrpModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  🚚
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Order Ready & Route Optimization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buyer notified & cluster route analyzed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVrpModal({ isOpen: false, order: null, clusterInfo: null })}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Notification Confirmation Box */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Buyer Notification Dispatched</span>
              </div>
              <p className="text-xs text-emerald-900 leading-snug pl-6">
                Buyer <strong>{vrpModal.order?.buyerName || 'Wholesale Buyer'}</strong> has been notified that Order #{vrpModal.order?.id} ({vrpModal.order?.quantityKg}kg {vrpModal.order?.cropName}) is ready for logistics pickup.
              </p>
            </div>

            {/* AI Multi-Order Cluster Check */}
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-blue-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-blue-800">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Route Optimizer (VRP) Cluster Alert</span>
                </div>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {vrpModal.clusterInfo?.totalReadyOrders || 1} Orders Ready
                </span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                The AI logistics engine detected <strong>{vrpModal.clusterInfo?.totalReadyOrders || 1} orders</strong> ready in the Bhopal & regional pickup cluster. Launching Route Optimization will compute the shortest multi-stop pickup path, cutting transport costs by up to 28%.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVrpModal({ isOpen: false, order: null, clusterInfo: null });
                  navigate('/route-optimizer?autoOptimize=true');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Truck className="w-4 h-4 text-amber-300" />
                <span>Redirect to Route Optimization & Check Best Route</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setVrpModal({ isOpen: false, order: null, clusterInfo: null })}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Stay on Orders List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
