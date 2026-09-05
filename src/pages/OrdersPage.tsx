import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [vrpAlertModal, setVrpAlertModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    clusterInfo: any;
  }>({
    isOpen: false,
    order: null,
    clusterInfo: null,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Farmer accepts and marks order ready for pickup
  const handleMarkReadyForPickup = async (targetOrder: Order) => {
    setUpdatingId(targetOrder.id);
    try {
      const res = await fetch(`/api/orders/${targetOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({ status: 'ready_for_pickup' }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchOrders();
        // Trigger Route optimization popup / check if other orders in cluster
        setVrpAlertModal({
          isOpen: true,
          order: targetOrder,
          clusterInfo: data.clusterInfo,
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update order status');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error marking ready');
    } finally {
      setUpdatingId(null);
    }
  };

  // Buyer releases escrow payment
  const handleReleaseEscrow = async (orderId: string) => {
    if (!confirm('Confirm you have inspected and received the produce? This will immediately transfer escrow funds to the farmer.')) {
      return;
    }

    setReleasingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/release-escrow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });

      if (res.ok) {
        await fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Escrow release failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReleasingId(null);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'confirmed': return 1;
      case 'ready_for_pickup': return 2;
      case 'in_transit': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              Escrow Protected Orders
            </span>
            <span className="text-xs text-slate-500">
              Role: <strong className="text-slate-800 uppercase">{user?.role}</strong> ({user?.name})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Produce Orders & Escrow Settlements
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mt-1">
            Track multi-party farm orders, transit progression, and secure escrow disbursement upon verified gate delivery.
          </p>
        </div>

        {/* Route Optimizer Shortcut */}
        <button
          onClick={() => navigate('/route-optimizer')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0"
        >
          <Truck className="w-4 h-4" />
          <span>Launch AI Route Optimizer (Module D)</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading order histories...
          </div>
        ) : orders.length > 0 ? (
          orders.map((ord) => {
            const step = getStatusStepIndex(ord.status);
            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      Order #{ord.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Escrow Status Badge */}
                    <div className="flex items-center gap-1 text-xs">
                      {ord.paymentStatus === 'held' ? (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-amber-300">
                          <Lock className="w-3.5 h-3.5" /> Escrow Held (₹{ord.totalAmount.toLocaleString('en-IN')})
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-300">
                          <Unlock className="w-3.5 h-3.5" /> Escrow Released to Farmer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Crop & Quantity */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{ord.cropName}</h3>
                      <p className="text-sm font-semibold text-emerald-700 font-mono mt-0.5">
                        {ord.quantityKg.toLocaleString()} KG @ ₹{ord.unitPricePerKg}/kg
                      </p>
                      <p className="text-xl font-extrabold text-slate-900 font-mono mt-2">
                        Total: ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Parties Involved */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <p>
                        👨‍🌾 Farmer: <strong className="text-slate-900">{ord.farmerName}</strong>
                      </p>
                      <p className="truncate text-slate-500">📍 Pickup: {ord.pickupAddress}</p>
                      <p className="pt-1">
                        🏢 Buyer: <strong className="text-slate-900">{ord.buyerName}</strong>
                      </p>
                      <p className="truncate text-slate-500">📍 Destination: {ord.deliveryAddress}</p>
                    </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col justify-between items-start md:items-end gap-2">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'ready_for_pickup'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>

                        {/* Farmer Action: Accept & Mark Ready for Pickup */}
                        {user?.role === 'farmer' && ord.status === 'confirmed' && (
                          <button
                            onClick={() => handleMarkReadyForPickup(ord)}
                            disabled={updatingId === ord.id}
                            className="mt-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>{updatingId === ord.id ? 'Updating...' : 'Accept & Mark Ready for Pickup'}</span>
                          </button>
                        )}

                        {/* Buyer Action: Release Escrow */}
                        {user?.role === 'buyer' && ord.paymentStatus === 'held' && (
                          <button
                            onClick={() => handleReleaseEscrow(ord.id)}
                            disabled={releasingId === ord.id}
                            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-98"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{releasingId === ord.id ? 'Releasing...' : 'Confirm Delivery & Release Escrow'}</span>
                          </button>
                        )}
                      </div>
                  </div>

                  {/* Visual Status Stepper */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className={`p-2 rounded-lg ${step >= 1 ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'text-slate-400'}`}>
                        1. Confirmed
                      </div>
                      <div className={`p-2 rounded-lg ${step >= 2 ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'text-slate-400'}`}>
                        2. Ready for Pickup
                      </div>
                      <div className={`p-2 rounded-lg ${step >= 3 ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200' : 'text-slate-400'}`}>
                        3. In Transit (VRP Routed)
                      </div>
                      <div className={`p-2 rounded-lg ${step >= 4 ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : 'text-slate-400'}`}>
                        4. Delivered & Settled
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Browse the marketplace to place your first direct farm order.
            </p>
            <Link
              to="/buyer/browse"
              className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
            >
              Browse Farm Produce
            </Link>
          </div>
        )}
      </div>

      {/* VRP Route Optimization & Buyer Notification Modal */}
      {vrpAlertModal.isOpen && vrpAlertModal.order && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-500/50 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold">
                🚚
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  AI Logistics Dispatch Notification
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Buyer Notified & Pickup Ready!
                </h3>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SMS & In-App Alert Dispatched to Buyer ({vrpAlertModal.order.buyerName})</span>
              </p>
              <p className="text-slate-600">
                Order <strong>#{vrpAlertModal.order.id}</strong> ({vrpAlertModal.order.quantityKg} kg {vrpAlertModal.order.cropName}) is staged for pickup at {vrpAlertModal.order.pickupAddress}.
              </p>
            </div>

            {/* Other orders ready for delivery cluster check */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Nearby Delivery Consolidation Check</span>
                </span>
                <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                  {vrpAlertModal.clusterInfo?.readyCount || 1} Orders Ready
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {vrpAlertModal.clusterInfo?.readyCount > 1
                  ? `AI detected ${vrpAlertModal.clusterInfo.readyCount} orders ready in this cluster (${vrpAlertModal.clusterInfo.totalKg} kg total). Consolidating routes will save ~${vrpAlertModal.clusterInfo.savingsPercent || 28}% in fuel costs.`
                  : 'AI can optimize the multi-stop dispatch route to calculate shortest distance, ETA, and maximum payload capacity.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVrpAlertModal({ isOpen: false, order: null, clusterInfo: null })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setVrpAlertModal({ isOpen: false, order: null, clusterInfo: null });
                  navigate('/route-optimizer');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Open Route Optimizer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
