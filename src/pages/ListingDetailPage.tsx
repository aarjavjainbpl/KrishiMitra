import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Lock,
  Phone,
  DollarSign,
  Info,
  Sliders,
  Check,
  Award,
  ZoomIn,
  BadgeCheck,
  Eye,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { FairPriceBadge } from '../components/FairPriceBadge';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false);
  const [orderQty, setOrderQty] = useState<number>(1000);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    user ? `${user.district}, ${user.state}` : 'APMC Wholesale Yard Bay 4, Navi Mumbai'
  );
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json();
        setListing(data.listing);
        if (data.listing?.quantityKg) {
          setOrderQty(Math.min(1000, data.listing.quantityKg));
        }

        // Also fetch historical price for this crop
        const histRes = await fetch(`/api/mandi-rates/history?crop=${data.listing.cropName}&days=30`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.history || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id]);

  const handlePlaceOrder = async () => {
    if (!listing) return;
    setPlacingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          quantityKg: orderQty,
          deliveryAddress,
          deliveryLat: user?.locationLat || 19.0760,
          deliveryLng: user?.locationLng || 72.8777,
        }),
      });

      if (!res.ok) throw new Error('Failed to create escrow order');
      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 1800);
    } catch (e: any) {
      alert(e.message || 'Order failed');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        Loading produce listing details...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Listing Not Found</h2>
        <Link to="/buyer/browse" className="text-sm font-semibold text-emerald-600 mt-2 inline-block">
          &larr; Back to marketplace
        </Link>
      </div>
    );
  }

  const [imageZoomed, setImageZoomed] = useState<boolean>(false);
  const [gradeGuideOpen, setGradeGuideOpen] = useState<boolean>(false);

  const totalAmount = Math.round(orderQty * listing.askingPricePerKg);
  const qp = listing.qualityPrediction;
  const grade = listing.qualityGrade || qp?.predictedGrade || 'A';

  const getGradeInfo = (g: string) => {
    switch (g) {
      case 'A':
        return {
          title: 'Grade A (Super Fine / Table Export Standard)',
          desc: 'Peak maturity, high color uniformity, zero skin blemishes or deep rot, firm pericarp structure. Recommended for retail supermarket shelves and long-haul dispatch.',
          badgeBg: 'bg-emerald-600 text-white',
          bannerBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
        };
      case 'B':
        return {
          title: 'Grade B (Standard Commercial Mandi Quality)',
          desc: 'Standard commercial wholesale produce with minor superficial skin peeling or slight color variation. 100% sound edible core and prime market utility.',
          badgeBg: 'bg-teal-600 text-white',
          bannerBg: 'bg-teal-50 border-teal-300 text-teal-950',
        };
      default:
        return {
          title: 'Grade C (Discount Processing / Pulping Tier)',
          desc: 'High cosmetic variation, non-uniform sizing, or slight over-ripeness. Best suited for industrial food processors, puree makers, or cattle feed.',
          badgeBg: 'bg-amber-600 text-white',
          bannerBg: 'bg-amber-50 border-amber-300 text-amber-950',
        };
    }
  };

  const currentGradeInfo = getGradeInfo(grade);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      {/* Main Grid: Details & Purchase Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image & Deep Quality & Mandi Historical Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="relative aspect-16/10 bg-slate-900 overflow-hidden group">
              <img
                src={listing.photoUrl}
                alt={listing.cropName}
                className={`w-full h-full object-cover transition-transform duration-300 ${imageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setImageZoomed(!imageZoomed)}
              />
              
              {/* Farmer Declared Grade Pill & Disease Status */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span
                  className={`text-sm font-black px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 ${currentGradeInfo.badgeBg}`}
                >
                  <BadgeCheck className="w-4 h-4" />
                  Farmer Published Grade: {grade}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {qp?.diseaseStatus === 'healthy' ? 'Certified Disease-Free' : 'Field Inspection Passed'}
                </span>
              </div>

              {/* Interactive Zoom Control */}
              <button
                type="button"
                onClick={() => setImageZoomed(!imageZoomed)}
                className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {imageZoomed ? 'Reset Zoom' : 'Click to Inspect Photo'}
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 font-display">
                    {listing.cropName}
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">{listing.variety}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-3xl font-extrabold text-emerald-700 font-mono">
                    ₹{listing.askingPricePerKg.toFixed(1)}
                    <span className="text-sm font-normal text-slate-500">/kg</span>
                  </p>
                  <p className="text-xs text-slate-400">Direct Farm Gate Asking Price</p>
                </div>
              </div>

              {/* Farmer Declared Quality Specification Banner */}
              <div className={`mt-4 p-4 rounded-xl border ${currentGradeInfo.bannerBg} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    {currentGradeInfo.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGradeGuideOpen(!gradeGuideOpen)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>Grade Spec Guide</span>
                    {gradeGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentGradeInfo.desc}
                </p>

                {/* Expandable Grade Comparison Guide */}
                {gradeGuideOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                    <p className="font-bold text-slate-800 text-[11px] uppercase">
                      Marketplace Grade Benchmark Guide:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                        <span className="font-black text-emerald-700 text-xs">Grade A (Export / Prime)</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Spotless skin, peak color ripeness (&gt;90%), maximum shelf life, table consumption.</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                        <span className="font-black text-teal-700 text-xs">Grade B (Standard Mandi)</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Sound commercial produce, minor natural curing marks, 100% edible core.</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                        <span className="font-black text-amber-700 text-xs">Grade C (Processing Tier)</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Cosmetic flaws, irregular sizes, discounted price for pulping and food processing.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Farmer Field Notes & Description
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>

          {/* AI Quality Certificate Card (Module C) */}
          {qp && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  AI Quality Inspection Certificate (Module C)
                </h3>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {(qp.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              {qp.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold">Color Ripeness</p>
                    <p className="text-lg font-bold text-slate-900">{qp.metrics.colorRipenessScore}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold">Uniformity</p>
                    <p className="text-lg font-bold text-slate-900">{qp.metrics.surfaceUniformityScore}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold">Blemish Free</p>
                    <p className="text-lg font-bold text-slate-900">{qp.metrics.blemishFreeScore}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold">Freshness</p>
                    <p className="text-lg font-bold text-slate-900">{qp.metrics.freshnessIndex}%</p>
                  </div>
                </div>
              )}

              {qp.defectNotes && qp.defectNotes.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                    Botanical Defect Notes:
                  </p>
                  {qp.defectNotes.map((note: string, idx: number) => (
                    <p key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{note}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* AI Right Price Evaluation for Buyer */}
              {(qp.predictedFairPricePerKg || qp.priceRationale) && (
                <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Certified Fair Valuation:
                    </span>
                    {qp.predictedFairPricePerKg && (
                      <span className="font-black text-emerald-800 font-mono text-sm">
                        ₹{qp.predictedFairPricePerKg.toFixed(1)}/kg {qp.predictedPricePerQuintal ? `(₹${qp.predictedPricePerQuintal}/Qtl)` : ''}
                      </span>
                    )}
                  </div>
                  {qp.priceRationale && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {qp.priceRationale}
                    </p>
                  )}
                  {qp.recommendedPriceRange && (
                    <p className="text-[10px] text-slate-500 font-bold">
                      Grade Fair Band: ₹{qp.recommendedPriceRange.min.toFixed(1)} – ₹{qp.recommendedPriceRange.max.toFixed(1)}/kg
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Historical Mandi Price Trend for this crop */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {listing.cropName} APMC Wholesale Mandi Benchmark (Last 30 Days)
                </h3>
                <p className="text-xs text-slate-500">Live Agmarknet & eNAM terminal price movements</p>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                Benchmark: ₹{listing.mandiModalReference?.toFixed(1)}/kg
              </span>
            </div>

            <div className="h-56 w-full">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit="₹"
                      domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin - 1.5)), (dataMax: number) => Math.ceil(dataMax + 1.5)]}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val: any) => [`₹${val}/kg`, 'Mandi Modal']}
                    />
                    <Area type="monotone" dataKey="modalPrice" stroke="#059669" strokeWidth={2} fill="#d1fae5" fillOpacity={0.4} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Loading mandi rate history...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Farmer Profile & Purchase Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Placement Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">
                Place Escrow Order
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Direct Settlement
              </span>
            </div>

            {/* Fair Price Math Card */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  Fair Price Score Index:
                </span>
                <span className="text-xs font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  {listing.fairPriceScore}/100
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200/60">
                <div className="flex justify-between">
                  <span>Mandi Modal Benchmark:</span>
                  <span className="font-semibold font-mono">₹{listing.mandiModalReference?.toFixed(1)}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Farmer Asking Price:</span>
                  <span className="font-semibold font-mono">₹{listing.askingPricePerKg.toFixed(1)}/kg</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900 pt-0.5">
                  <span>Buyer Savings vs Traditional Retail:</span>
                  <span>~₹{(listing.mandiModalReference * 1.25 - listing.askingPricePerKg).toFixed(1)}/kg</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                <span>Order Quantity:</span>
                <span className="text-slate-500 font-normal">
                  Max: {listing.quantityKg.toLocaleString()} kg
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  max={listing.quantityKg}
                  step={100}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(100, Math.min(listing.quantityKg, Number(e.target.value))))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-base focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-sm font-bold text-slate-500 shrink-0">KG</span>
              </div>
            </div>

            {/* Delivery Destination */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Delivery Warehouse / Address:
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Navi Mumbai APMC Bay 14"
              />
            </div>

            {/* Escrow Guarantee Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Smart Escrow Protection</p>
                <p className="text-[11px] text-slate-500">
                  Your payment of ₹{totalAmount.toLocaleString('en-IN')} is held securely in escrow and only released to the farmer after you inspect & confirm delivery.
                </p>
              </div>
            </div>

            {/* Total & Action */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-sm font-bold text-slate-700">Total Escrow Amount:</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {orderSuccess ? (
                <div className="p-3 bg-emerald-500 text-white rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Order Placed & Escrow Secured!
                </div>
              ) : (
                <button
                  id="confirm-place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>{placingOrder ? 'Locking Escrow...' : `Authorize Escrow & Place Order (₹${totalAmount.toLocaleString('en-IN')})`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Farmer Contact & Trust Profile */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Verified Farmer Profile
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {listing.farmerName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                  {listing.farmerName}
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                </p>
                <p className="text-xs text-slate-500">{listing.farmerLocation}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {listing.farmerPhone}
              </span>
              <span className="text-emerald-700 font-semibold">
                APMC Verified Farm Gate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
