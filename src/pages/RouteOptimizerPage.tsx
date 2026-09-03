import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Route as RouteIcon,
  CheckCircle2,
  Clock,
  Navigation,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Layers,
  Sparkles,
  RefreshCw,
  Package,
  Calendar
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams, Link } from 'react-router-dom';
import { OptimizedRoute, Order } from '../types';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet Default Marker Icons in Vite
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom Numbered Icon Generator
function createNumberedMarker(number: number | string, isDepot: boolean = false) {
  const bg = isDepot ? '#0f172a' : '#059669';
  const html = `
    <div style="
      background-color: ${bg};
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      font-family: sans-serif;
    ">
      ${number}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Click to set depot component
function DepotPickerMapEvents({ onSetDepot }: { onSetDepot: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSetDepot(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const RouteOptimizerPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const autoOptimizeParam = searchParams.get('autoOptimize') === 'true';

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [depot, setDepot] = useState<{ lat: number; lng: number; name: string }>({
    lat: 23.2980,
    lng: 77.3910,
    name: 'Karond Central APMC Logistics Hub, Bhopal',
  });

  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Preset hubs for Bhopal & MP region
  const presetHubs = [
    { name: 'Karond APMC Wholesale Terminal, Bhopal (MP)', lat: 23.2980, lng: 77.3910 },
    { name: 'Berasia Mandi Aggregation Yard, Bhopal (MP)', lat: 23.6300, lng: 77.4300 },
    { name: 'Mandideep Industrial Logistics Park, Bhopal (MP)', lat: 23.0560, lng: 77.5190 },
    { name: 'MP Nagar Zone 2 Distribution Depot, Bhopal (MP)', lat: 23.2332, lng: 77.4343 },
    { name: 'Sehore Sharbati Grain APMC Hub (MP)', lat: 23.2000, lng: 77.0850 },
    { name: 'Indore Choithram APMC Regional Depot (MP)', lat: 22.7196, lng: 75.8577 },
  ];

  // Run VRP optimizer with specified orders
  const runOptimizationWithOrders = async (targetOrders: Order[], depotObj = depot) => {
    if (targetOrders.length === 0) return;
    setOptimizing(true);
    setError(null);
    try {
      const stops = targetOrders.map((o) => ({
        orderId: o.id,
        lat: o.pickupLat,
        lng: o.pickupLng,
        farmerName: o.farmerName,
        cropName: o.cropName,
        quantityKg: o.quantityKg,
        address: o.pickupAddress,
      }));

      const res = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depot: depotObj,
          stops,
          vehicleCount: 1,
        }),
      });

      if (!res.ok) throw new Error('Route optimization solver failed');
      const data = await res.json();
      setOptimizedRoute(data.route);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error computing route optimization');
    } finally {
      setOptimizing(false);
    }
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
          // Prefer ready_for_pickup orders, otherwise all confirmed
          const readyOrConfirmed = data.orders.filter((o: Order) => o.status === 'ready_for_pickup' || o.status === 'confirmed');
          const toSelect = readyOrConfirmed.length > 0 ? readyOrConfirmed : data.orders;
          setSelectedOrderIds(toSelect.map((o: Order) => o.id));

          if (autoOptimizeParam) {
            runOptimizationWithOrders(toSelect);
          }
        }
      }
    } catch (e) {
      console.warn('Orders fetch note:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleToggleOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((oid) => oid !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const handleOptimize = async () => {
    if (selectedOrderIds.length === 0) {
      setError('Please select at least one order to optimize route');
      return;
    }
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    runOptimizationWithOrders(selectedOrders);
  };

  // Center coordinate for map
  const mapCenter: [number, number] = [depot.lat, depot.lng];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              Module D • Vehicle Routing Problem (VRP) & OSRM Road Matrix
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {user?.role === 'farmer' ? 'Farmer Farm Pickup & Consolidation Console' : 'Multi-Stop Buyer Route Solver'}
            </span>
          </div>

          {user?.role === 'farmer' ? (
            <Link
              to="/farmer/dashboard"
              className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit transition-all"
            >
              <span>← Back to Farmer Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/buyer/browse"
              className="text-xs font-black text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 w-fit transition-all"
            >
              <span>← Back to Wholesale Mart</span>
            </Link>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          AI Multi-Stop Route Optimizer
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl mt-1">
          Solves the multi-farmer pickup routing problem. Bundles confirmed farm orders into a single mathematically optimal route using <span className="font-semibold text-slate-900">OSRM road networks and Google OR-Tools VRP algorithms</span>.
        </p>
      </div>

      {/* Main Grid: Control & Order Selection (4 cols) + Interactive Map & Manifest (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Side: Hub & Order Checkbox List (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Aggregation Hub Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              1. Select Dispatch / Aggregation Hub
            </h3>

            <div className="space-y-2">
              {presetHubs.map((hub, idx) => (
                <button
                  key={idx}
                  onClick={() => setDepot(hub)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    depot.name === hub.name
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate">{hub.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {hub.lat.toFixed(4)}, {hub.lng.toFixed(4)}
                    </p>
                  </div>
                  {depot.name === hub.name && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-2 italic">
              💡 Tip: You can also click anywhere directly on the map to place a custom depot pin.
            </p>
          </div>

          {/* Confirmed Orders to Bundle */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                2. Orders Ready for Pickup ({orders.length})
              </h3>
              <span className="text-xs font-semibold text-emerald-700">
                {selectedOrderIds.length} Selected
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {orders.length > 0 ? (
                orders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord.id);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => handleToggleOrder(ord.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 font-medium'
                          : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span className="font-bold text-slate-900">
                            {ord.cropName} ({ord.quantityKg} kg)
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                          {ord.id}
                        </span>
                      </div>
                      <div className="mt-1.5 pl-6 text-slate-500 text-[11px]">
                        <p>👨‍🌾 Farmer: <strong className="text-slate-800">{ord.farmerName}</strong></p>
                        <p className="truncate">📍 {ord.pickupAddress}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No confirmed orders found. Place orders in marketplace first.
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-semibold mt-2">{error}</p>
            )}

            <button
              id="optimize-route-action-btn"
              onClick={handleOptimize}
              disabled={optimizing || selectedOrderIds.length === 0}
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Truck className={`w-4 h-4 ${optimizing ? 'animate-bounce' : ''}`} />
              <span>{optimizing ? 'Solving VRP Road Route...' : 'Compute Optimized Pickup Route'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Leaflet Map & Optimization KPIs (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive Leaflet Map Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Interactive Route Map (OpenStreetMap Road Network)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Depot: <span className="font-semibold text-slate-800">{depot.name}</span>
              </span>
            </div>

            <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={10}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <DepotPickerMapEvents
                  onSetDepot={(lat, lng) =>
                    setDepot({ lat, lng, name: `Custom Logistics Depot (${lat.toFixed(3)}, ${lng.toFixed(3)})` })
                  }
                />

                {/* Depot Marker */}
                <Marker position={[depot.lat, depot.lng]} icon={createNumberedMarker('🏭', true)}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-slate-900 text-xs">Logistics Hub (Depot)</p>
                      <p className="text-[11px] text-slate-600">{depot.name}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Unoptimized Order Pins */}
                {!optimizedRoute &&
                  orders.map((ord, idx) => (
                    <Marker
                      key={ord.id}
                      position={[ord.pickupLat, ord.pickupLng]}
                      icon={createNumberedMarker(idx + 1, false)}
                    >
                      <Popup>
                        <div className="p-1">
                          <p className="font-bold text-slate-900 text-xs">{ord.cropName} Pickup</p>
                          <p className="text-[11px] text-slate-700">Farmer: {ord.farmerName}</p>
                          <p className="text-[11px] text-emerald-700 font-semibold">{ord.quantityKg} kg</p>
                          <p className="text-[10px] text-slate-500">{ord.pickupAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Optimized Sequenced Stops */}
                {optimizedRoute &&
                  optimizedRoute.stops.map((stop) => (
                    <Marker
                      key={stop.id}
                      position={[stop.stopLat, stop.stopLng]}
                      icon={createNumberedMarker(stop.sequenceNumber, false)}
                    >
                      <Popup>
                        <div className="p-1">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            Stop #{stop.sequenceNumber}
                          </span>
                          <p className="font-bold text-slate-900 text-xs mt-1">
                            {stop.farmerName} • {stop.cropName}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Cargo: <strong className="text-slate-900">{stop.quantityKg} kg</strong>
                          </p>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Est. Arrival: ~{stop.etaMinutes} min from departure
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{stop.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Optimized Route Polyline */}
                {optimizedRoute && optimizedRoute.geometry.length > 1 && (
                  <Polyline
                    positions={optimizedRoute.geometry}
                    pathOptions={{
                      color: '#059669',
                      weight: 4,
                      opacity: 0.85,
                      dashArray: '2, 6',
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* Optimized Route KPIs Summary */}
          {optimizedRoute && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Circuit Distance
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                    {optimizedRoute.totalDistanceKm} km
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {optimizedRoute.stopsCount} Farm Pickups
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Estimated Time (ETA)
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                    {Math.floor(optimizedRoute.totalDurationMin / 60)}h {optimizedRoute.totalDurationMin % 60}m
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Incl. loading buffer
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Distance Saved
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-1 font-mono">
                    {optimizedRoute.distanceSavedKm} km
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    vs naive individual trips
                  </p>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    CO2 Carbon Reduction
                  </p>
                  <p className="text-2xl font-extrabold text-white mt-1 font-mono">
                    ~{optimizedRoute.carbonSavedKg} kg
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Green Logistics Metric
                  </p>
                </div>
              </div>

              {/* Turn-by-Turn Pickup Manifest Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Turn-by-Turn Driver Dispatch Manifest
                    </h4>
                    <p className="text-xs text-slate-500">
                      Optimal stop sequence with cumulative drive times and loading windows
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Total Cargo: {optimizedRoute.totalProduceKg.toLocaleString()} kg
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Sequence</th>
                        <th className="py-2.5 px-3">Farmer & Location</th>
                        <th className="py-2.5 px-3">Produce Type</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Leg Distance</th>
                        <th className="py-2.5 px-3 text-right">Estimated Arrival</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">Start (0)</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{optimizedRoute.depotName}</td>
                        <td className="py-2.5 px-3 text-slate-500">Dispatch Departure</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">--</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">0.0 km</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">T + 0 min</td>
                      </tr>

                      {optimizedRoute.stops.map((stop) => (
                        <tr key={stop.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[10px]">
                              {stop.sequenceNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900">{stop.farmerName}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-xs">{stop.address}</p>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{stop.cropName}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                            {stop.quantityKg.toLocaleString()} kg
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                            +{stop.distanceFromPreviousKm} km
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                            ~{stop.etaMinutes} min
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">End ({optimizedRoute.stops.length + 1})</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Return to {optimizedRoute.depotName}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-medium">Unloading & Consolidation</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{optimizedRoute.totalProduceKg} kg</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Return leg</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ~{optimizedRoute.totalDurationMin} min
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
