import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Truck,
  CheckCircle2,
  Award,
  ZoomIn,
  BadgeCheck,
  Eye
} from 'lucide-react';
import { Listing } from '../types';
import { FairPriceBadge } from '../components/FairPriceBadge';
import { ImageGradeInspectionModal } from '../components/ImageGradeInspectionModal';
import { fallbackListings } from '../data/fallbackData';

export const BuyerBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchCrop, setSearchCrop] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [sortBy, setSortBy] = useState<'fairPrice' | 'priceLow' | 'quantity'>('fairPrice');
  const [inspectListing, setInspectListing] = useState<any | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);

  const handleOpenInspect = (listing: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setInspectListing(listing);
    setInspectModalOpen(true);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchCrop) params.append('crop', searchCrop);
      if (filterRegion) params.append('region', filterRegion);
      if (filterGrade) params.append('qualityGrade', filterGrade);

      const res = await fetch(`/api/listings?${params.toString()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.listings && data.listings.length > 0) {
          setListings(data.listings);
          return;
        }
      }
      setListings(fallbackListings);
    } catch (e) {
      console.warn('Error loading listings, using fallback:', e);
      setListings(fallbackListings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchCrop, filterRegion, filterGrade]);

  const sortedListings = React.useMemo(() => {
    const list = [...listings];
    if (sortBy === 'fairPrice') {
      list.sort((a, b) => (b.fairPriceScore || 0) - (a.fairPriceScore || 0));
    } else if (sortBy === 'priceLow') {
      list.sort((a, b) => a.askingPricePerKg - b.askingPricePerKg);
    } else if (sortBy === 'quantity') {
      list.sort((a, b) => b.quantityKg - a.quantityKg);
    }
    return list;
  }, [listings, sortBy]);

  const crops = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Green Chilli', 'Banana', 'Soybean', 'Mustard'];
  const regions = ['Maharashtra', 'Punjab', 'Madhya Pradesh', 'Karnataka', 'Delhi'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              Direct Farmer Trade
            </span>
            <span className="text-xs text-slate-500">Zero Middleman Commissions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Direct Farm Produce Marketplace
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mt-1">
            Source bulk agricultural produce directly from verified farmers at transparent prices backed by <strong className="text-slate-900">AI Quality Inspection (Module C)</strong> and live <strong className="text-slate-900">Fair Price Benchmarks (Module A)</strong>.
          </p>
        </div>

        {/* Quick Route Optimizer Link */}
        <button
          onClick={() => navigate('/route-optimizer')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0"
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Plan Multi-Stop Pickup Route (Module D)</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Crop Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search produce (e.g. Tomato)..."
              value={searchCrop}
              onChange={(e) => setSearchCrop(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 w-52"
            />
          </div>

          {/* Region filter */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>📍 {r}</option>
            ))}
          </select>

          {/* Quality Grade filter */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
          >
            <option value="">All Quality Grades</option>
            <option value="A">Grade A (Premium / Export Table)</option>
            <option value="B">Grade B (Standard Commercial Market)</option>
            <option value="C">Grade C (Discount Processing / Pulping)</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="fairPrice">✨ Highest Fair Price Score</option>
            <option value="priceLow">💰 Lowest Price (₹/kg)</option>
            <option value="quantity">📦 Largest Quantity (kg)</option>
          </select>
        </div>
      </div>

      {/* Produce Listings Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading farm produce listings...
          </div>
        ) : sortedListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedListings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Photo with Grade Badge & Quick Image Inspect Button */}
                  <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                    <img
                      src={item.photoUrl}
                      alt={item.cropName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Explicit Farmer Declared Grade Pill */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 ${
                          item.qualityGrade === 'A'
                            ? 'bg-emerald-600 text-white'
                            : item.qualityGrade === 'B'
                            ? 'bg-teal-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Farmer Grade: {item.qualityGrade} {item.qualityGrade === 'A' ? '(Prime)' : item.qualityGrade === 'B' ? '(Standard)' : '(Commercial)'}
                      </span>
                    </div>

                    {/* Quick Image & Grade Inspection Trigger */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenInspect(item, e)}
                      className="absolute top-3 right-3 bg-slate-900/85 hover:bg-slate-900 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-transform active:scale-95 hover:border-emerald-400 border border-white/10"
                      title="Inspect Farmer Crop Image & Quality Report"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inspect Image</span>
                    </button>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-white/95 backdrop-blur-xs text-slate-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        📦 {item.quantityKg.toLocaleString()} kg available
                      </span>
                      <span className="bg-slate-900/80 backdrop-blur-xs text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        {item.qualityPrediction?.diseaseStatus === 'healthy' ? '✓ Disease-Free' : 'Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-emerald-700 transition-colors">
                          {item.cropName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{item.variety}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-emerald-700 font-mono">
                          ₹{item.askingPricePerKg.toFixed(1)}
                          <span className="text-xs text-slate-500 font-normal">/kg</span>
                        </p>
                        <p className="text-[10px] text-slate-400">Farm Gate Price</p>
                      </div>
                    </div>

                    {/* Farmer Location & Harvest */}
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.farmerLocation}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Harvested: {item.harvestDate}</span>
                      </p>
                    </div>

                    {/* Mini Optical Grade Score Strip */}
                    {item.qualityPrediction?.metrics && (
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Visual Quality:</span>
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span>Ripeness {item.qualityPrediction.metrics.colorRipenessScore}%</span>
                          <span className="text-slate-300">•</span>
                          <span>Blemish-Free {item.qualityPrediction.metrics.blemishFreeScore}%</span>
                        </div>
                      </div>
                    )}

                    {/* Fair Price Index Badge */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <FairPriceBadge
                        score={item.fairPriceScore || 90}
                        size="sm"
                        showDetail={false}
                      />
                      {item.savingsVsRetailPerKg > 0 && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> Saves ~₹{item.savingsVsRetailPerKg}/kg vs APMC retail
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 truncate">
                    Farmer: <strong className="text-slate-800">{item.farmerName}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleOpenInspect(item, e)}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Image Report
                    </button>
                    <Link
                      to={`/buyer/listing/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>Buy</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Listings Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your crop or region filters.
            </p>
          </div>
        )}
      </div>

      {/* Image & Grade Inspection Modal */}
      <ImageGradeInspectionModal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        listing={inspectListing}
      />
    </div>
  );
};
