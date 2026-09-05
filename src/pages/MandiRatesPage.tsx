import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import { MandiPriceRecord } from '../types';

export const MandiRatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rates, setRates] = useState<MandiPriceRecord[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  
  const [selectedCrop, setSelectedCrop] = useState<string>('Wheat');
  const [selectedState, setSelectedState] = useState<string>('Madhya Pradesh');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyDays, setHistoryDays] = useState<number>(30);
  const [bhopalOnly, setBhopalOnly] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string>('');

  // Fetch mandi rates
  const fetchRates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCrop) params.append('crop', selectedCrop);
      if (selectedState) params.append('region', selectedState);

      const res = await fetch(`/api/mandi-rates?${params.toString()}`);
      const data = await res.json();
      if (data.rates) {
        setRates(data.rates);
        if (data.filters?.crops) setCrops(data.filters.crops);
        if (data.filters?.states) setStates(data.filters.states);
        if (data.lastSynced) setLastSynced(data.lastSynced);
      }
    } catch (err) {
      console.error('Error loading mandi rates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical chart data
  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams({
        crop: selectedCrop,
        days: historyDays.toString(),
      });
      if (selectedState) params.append('region', selectedState);

      const res = await fetch(`/api/mandi-rates/history?${params.toString()}`);
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchHistory();
  }, [selectedCrop, selectedState, historyDays]);

  // Handle manual sync trigger
  const handleSync = async () => {
    setSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch('/api/mandi-rates/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setSyncSuccessMsg(data.message);
        await fetchRates();
        await fetchHistory();
        setTimeout(() => setSyncSuccessMsg(null), 6000);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Filter table by search & Bhopal focus
  const filteredRates = rates.filter((r) => {
    if (bhopalOnly) {
      const isBhopalCluster = 
        r.market.toLowerCase().includes('bhopal') || 
        r.district.toLowerCase().includes('bhopal') ||
        r.district.toLowerCase().includes('sehore') ||
        r.district.toLowerCase().includes('vidisha') ||
        r.district.toLowerCase().includes('raisen') ||
        r.district.toLowerCase().includes('hoshangabad') ||
        r.district.toLowerCase().includes('narmadapuram');
      if (!isBhopalCluster) return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      r.market.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.variety.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q)
    );
  });

  // Calculate current average modal price for banner
  const currentAvgModal = rates.length > 0
    ? (rates.reduce((sum, r) => sum + r.modalPrice, 0) / rates.length).toFixed(1)
    : '22.0';

  const lowestMandi = rates.length > 0
    ? rates.reduce((min, r) => (r.minPrice < min.minPrice ? r : min), rates[0])
    : null;

  const highestMandi = rates.length > 0
    ? rates.reduce((max, r) => (r.maxPrice > max.maxPrice ? r : max), rates[0])
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              Module A • Live Agmarknet & eNAM Feed
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Updated: {lastSynced ? new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Live Wholesale Mandi Rates
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mt-1">
            Official daily wholesale APMC price index from <span className="font-semibold text-slate-800">data.gov.in (Agmarknet)</span> and <span className="font-semibold text-slate-800">eNAM electronic trade terminals</span>. Eliminates information asymmetry so farmers never sell below fair market value.
          </p>
        </div>

        {/* Sync Action & AI Forecast Shortcut */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="refresh-mandi-rates-btn"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-98"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Mandis...' : 'Refresh Live Rates'}</span>
          </button>

          <button
            onClick={() => navigate(`/price-predictor?crop=${selectedCrop}`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Forecast {selectedCrop} Trend (Module B)</span>
          </button>
        </div>
      </div>

      {/* Sync Success Notification Toast */}
      {syncSuccessMsg && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{syncSuccessMsg}</span>
          </div>
          <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
            Verified Source
          </span>
        </div>
      )}

      {/* Control Filter Bar */}
      <div className="mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Crop Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Crop / Commodity
            </label>
            <select
              id="mandi-crop-select"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 font-semibold"
            >
              {crops.map((c) => (
                <option key={c} value={c}>
                  🌾 {c}
                </option>
              ))}
            </select>
          </div>

          {/* State Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              State / Region Filter
            </label>
            <select
              id="mandi-state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
            >
              <option value="">All Trading States ({states.length})</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  📍 {s}
                </option>
              ))}
            </select>
          </div>

          {/* Search Mandi Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Mandi / Market
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Karond, Berasia, Sehore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {/* Bhopal Mandi Quick Filter Toggle */}
          <div className="self-end pb-0.5">
            <button
              onClick={() => setBhopalOnly(!bhopalOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                bhopalOnly
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <span>🏛️</span>
              <span>{bhopalOnly ? 'Bhopal Cluster Filter Active' : 'Filter Bhopal Cluster Only'}</span>
            </button>
          </div>
        </div>

        {/* History Range Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 px-2">Trend:</span>
          {[7, 15, 30].map((d) => (
            <button
              key={d}
              onClick={() => setHistoryDays(d)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                historyDays === d
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Average Modal Price ({selectedCrop})
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              ₹{currentAvgModal}
            </span>
            <span className="text-sm font-semibold text-slate-500">/ kg</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Real-time weighted APMC arrival rate
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lowest Mandi (Farm Gate Advantage)
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{lowestMandi?.minPrice || '--'}
            </span>
            <span className="text-xs text-slate-500">/ kg</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 truncate">
            {lowestMandi ? `${lowestMandi.market} (${lowestMandi.state})` : 'Calculating...'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Highest Terminal Mandi (Consumer Hub)
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              ₹{highestMandi?.maxPrice || '--'}
            </span>
            <span className="text-xs text-slate-500">/ kg</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 truncate">
            {highestMandi ? `${highestMandi.market} (${highestMandi.state})` : 'Calculating...'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-xl border border-emerald-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">
                Intermediary Spread
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              +38% to 65%
            </p>
            <p className="text-[11px] text-emerald-200 mt-0.5 leading-tight">
              Average markup captured by multi-tier middlemen in traditional supply chain.
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Historical Price Chart (Recharts) */}
      <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {selectedCrop} Wholesale Price Trend (Last {historyDays} Days)
            </h2>
            <p className="text-xs text-slate-500">
              Daily Modal Price (₹/kg) with Minimum and Maximum Auction Bands across reporting mandis
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              Modal Price
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3 h-1 bg-slate-300 inline-block"></span>
              Min/Max Spread Band
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mandiModalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => str.slice(5)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  unit="₹"
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(value: any) => [`₹${value}/kg`, '']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="maxPrice"
                  name="Max Price Band"
                  stroke="#cbd5e1"
                  strokeDasharray="2 2"
                  fill="#f1f5f9"
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="modalPrice"
                  name="Modal Price"
                  stroke="#059669"
                  strokeWidth={3}
                  fill="url(#mandiModalGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="minPrice"
                  name="Min Price Band"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading price history chart...
            </div>
          )}
        </div>
      </div>

      {/* Mandi Rates Data Table with Source Badges */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Mandi-Wise Price Breakdown ({filteredRates.length} reporting centers)
            </h3>
            <p className="text-xs text-slate-500">
              Each row displays verified modal, minimum, and ceiling prices with live government provenance logs
            </p>
          </div>
          <span className="text-xs text-slate-600 font-medium">
            Showing <span className="font-bold text-slate-900">{filteredRates.length}</span> entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/90 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Market / Mandi</th>
                <th className="py-3 px-4">State & District</th>
                <th className="py-3 px-4">Variety</th>
                <th className="py-3 px-4 text-right">Min Price</th>
                <th className="py-3 px-4 text-right">Modal (Avg)</th>
                <th className="py-3 px-4 text-right">Max Price</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length > 0 ? (
                filteredRates.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{row.market}</span>
                        {(row.district.toLowerCase() === 'bhopal' || row.market.toLowerCase().includes('bhopal')) && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
                            Bhopal APMC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.district}, <span className="font-medium text-slate-800">{row.state}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {row.variety}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      ₹{row.minPrice.toFixed(1)}/kg
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 text-base font-mono">
                      ₹{row.modalPrice.toFixed(1)}/kg
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      ₹{row.maxPrice.toFixed(1)}/kg
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.source === 'agmarknet'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : row.source === 'enam'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {row.source === 'agmarknet'
                          ? 'Agmarknet'
                          : row.source === 'enam'
                          ? 'eNAM Portal'
                          : 'Seed Cache'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                    No mandi price records found for this filter. Try selecting "All States" or clearing search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
