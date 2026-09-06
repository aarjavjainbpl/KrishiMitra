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
  ExternalLink,
  Phone,
  X,
  Receipt,
  Landmark,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { SettlementReceiptModal } from '../components/SettlementReceiptModal';
import { FarmerDeliveryModal } from '../components/FarmerDeliveryModal';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pickupModalOrder, setPickupModalOrder] = useState<Order | null>(null);
  const [escrowModalOrder, setEscrowModalOrder] = useState<Order | null>(null);
  const [farmerDeliveryModalOrder, setFarmerDeliveryModalOrder] = useState<Order | null>(null);
  const [settlementReceiptOrder, setSettlementReceiptOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [vrpAlertModal, setVrpAlertModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    clusterInfo: any;
  }>({
    isOpen: false,
    order: null,
    clusterInfo: null,
  });

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

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
        setToast({
          type: 'success',
          message: `Order #${targetOrder.id} marked Ready for Pickup! Buyer has been notified.`,
        });
        setVrpAlertModal({
          isOpen: true,
          order: targetOrder,
          clusterInfo: data.clusterInfo,
        });
      } else {
        const err = await res.json();
        setToast({
          type: 'error',
          message: err.error || 'Failed to update order status',
        });
      }
    } catch (e: any) {
      console.error(e);
      setToast({
        type: 'error',
        message: e.message || 'Error marking ready',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Buyer confirms pickup from farm gate (non-blocking in-app execution)
  const handleConfirmPickupSubmit = async (targetOrder: Order) => {
    setUpdatingId(targetOrder.id);
    try {
      const res = await fetch(`/api/orders/${targetOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({ status: 'in_transit' }),
      });

      if (res.ok) {
        setPickupModalOrder(null);
        await fetchOrders();
        setToast({
          type: 'success',
          message: `🚚 Pickup confirmed for Order #${targetOrder.id}! Consignment is now In Transit. Farmer has been notified.`,
        });
      } else {
        const err = await res.json();
        setToast({
          type: 'error',
          message: err.error || 'Failed to confirm pickup',
        });
      }
    } catch (e: any) {
      console.error(e);
      setToast({
        type: 'error',
        message: e.message || 'Error confirming pickup',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Buyer releases escrow payment (non-blocking in-app execution)
  const handleReleaseEscrowSubmit = async (targetOrder: Order) => {
    setReleasingId(targetOrder.id);
    try {
      const token = localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || '';
      const savedUserStr = localStorage.getItem('krishimitra_user') || localStorage.getItem('agriconnect_user');
      let userId = '';
      if (savedUserStr) {
        try {
          userId = JSON.parse(savedUserStr).id;
        } catch (_) {}
      }

      const res = await fetch(`/api/orders/${targetOrder.id}/release-escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          deliveryRemarks: 'Verified and accepted by buyer at destination. Escrow funds released.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEscrowModalOrder(null);
        await fetchOrders();
        setToast({
          type: 'success',
          message: `💰 Escrow payment of ₹${targetOrder.totalAmount.toLocaleString('en-IN')} released to farmer ${targetOrder.farmerName}!`,
        });
        const updatedOrd = data.order || { ...targetOrder, status: 'delivered', payment: data.payment };
        setSettlementReceiptOrder(updatedOrd);
      } else {
        const err = await res.json();
        setToast({
          type: 'error',
          message: err.error || 'Escrow release failed',
        });
      }
    } catch (e: any) {
      console.error(e);
      setToast({
        type: 'error',
        message: e.message || 'Error releasing payment',
      });
    } finally {
      setReleasingId(null);
    }
  };

  const handleFarmerDeliverySuccess = async (updatedOrder: any) => {
    setFarmerDeliveryModalOrder(null);
    await fetchOrders();
    setToast({
      type: 'success',
      message: `🎉 Consignment delivery confirmed! Payout of ₹${updatedOrder.totalAmount.toLocaleString('en-IN')} settled to your bank account.`,
    });
    setSettlementReceiptOrder(updatedOrder);
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

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const totalSettledAmount = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalTonnageSettledKg = deliveredOrders.reduce((sum, o) => sum + o.quantityKg, 0);
  const mandiBrokerageSaved = Math.round(totalSettledAmount * 0.06);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (statusFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

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

      {/* Delivered & Settled Metrics Strip (Especially helpful for Farmers/Sellers) */}
      {deliveredOrders.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-emerald-850 via-emerald-800 to-teal-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-300 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {user?.role === 'farmer' ? 'Your Settled Payouts' : 'Settled Farm Disbursements'}
                </span>
                <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  100% Escrow Disbursed
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                ₹{totalSettledAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Volume Delivered</div>
              <div className="font-mono font-bold text-white text-sm">
                {totalTonnageSettledKg.toLocaleString()} KG ({(totalTonnageSettledKg / 100).toFixed(1)} Qtl)
              </div>
            </div>
            <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Brokerage Commission Saved</div>
              <div className="font-mono font-bold text-amber-300 text-sm">
                +₹{mandiBrokerageSaved.toLocaleString('en-IN')} (0% Cut)
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('delivered')}
              className="px-3.5 py-2 bg-white text-emerald-900 font-extrabold rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              <span>View Settled Vouchers ({deliveredOrders.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'active'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>In-Progress / Transit ({activeOrders.length})</span>
        </button>
        <button
          onClick={() => setStatusFilter('delivered')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'delivered'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Delivered & Settled ({deliveredOrders.length})</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading order histories...
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((ord) => {
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
                      {ord.status === 'delivered' || ord.paymentStatus === 'released' ? (
                        <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Escrow Settled: ₹{ord.totalAmount.toLocaleString('en-IN')} Credited</span>
                        </span>
                      ) : ord.paymentStatus === 'held' ? (
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
                        {ord.quantityKg.toLocaleString()} KG ({(ord.quantityKg / 100).toFixed(1)} Qtl) @ ₹{ord.agreedPricePerKg || (ord as any).unitPricePerKg || 0}/kg
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
                          {ord.status.replace(/_/g, ' ')}
                        </span>

                        {/* Farmer Action: Accept & Mark Ready for Pickup */}
                        {user?.role === 'farmer' && ord.status === 'confirmed' && (
                          <button
                            id={`farmer-ready-btn-${ord.id}`}
                            onClick={() => handleMarkReadyForPickup(ord)}
                            disabled={updatingId === ord.id}
                            className="mt-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>{updatingId === ord.id ? 'Updating...' : 'Accept & Mark Ready for Pickup'}</span>
                          </button>
                        )}

                        {user?.role === 'farmer' && ord.status === 'ready_for_pickup' && (
                          <span className="mt-2 text-xs text-amber-800 font-semibold flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Awaiting Buyer Pickup</span>
                          </span>
                        )}

                        {user?.role === 'farmer' && ord.status === 'in_transit' && (
                          <div className="flex flex-col items-end gap-1.5 mt-2">
                            <span className="text-xs text-blue-800 font-semibold flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Consignment in Transit</span>
                            </span>
                            <button
                              id={`farmer-confirm-delivery-btn-${ord.id}`}
                              onClick={() => setFarmerDeliveryModalOrder(ord)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-200" />
                              <span>Confirm Handover & Settle Escrow</span>
                            </button>
                          </div>
                        )}

                        {user?.role === 'farmer' && ord.status === 'delivered' && (
                          <div className="flex flex-col items-end gap-2 mt-2">
                            <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivered & Settled (₹{ord.totalAmount.toLocaleString('en-IN')})</span>
                            </span>
                            <button
                              id={`farmer-view-receipt-btn-${ord.id}`}
                              onClick={() => setSettlementReceiptOrder(ord)}
                              className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Settlement & Payout Slip</span>
                            </button>
                          </div>
                        )}

                        {/* Buyer Action: Confirm Pickup when ready_for_pickup */}
                        {user?.role === 'buyer' && ord.status === 'ready_for_pickup' && (
                          <button
                            id={`buyer-confirm-pickup-btn-${ord.id}`}
                            onClick={() => setPickupModalOrder(ord)}
                            disabled={updatingId === ord.id}
                            className="mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <Truck className="w-4 h-4 text-blue-200" />
                            <span>Confirm Farm Pickup</span>
                          </button>
                        )}

                        {/* Buyer Status: When confirmed, show waiting status plus direct pickup option */}
                        {user?.role === 'buyer' && ord.status === 'confirmed' && (
                          <div className="flex flex-col items-end gap-1.5 mt-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Awaiting Farmer Packing</span>
                            </span>
                            <button
                              id={`buyer-direct-pickup-btn-${ord.id}`}
                              onClick={() => setPickupModalOrder(ord)}
                              disabled={updatingId === ord.id}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Direct Farm-Gate Pickup</span>
                            </button>
                          </div>
                        )}

                        {/* Buyer Action: Release Escrow once in transit */}
                        {user?.role === 'buyer' && ord.status === 'in_transit' && ord.paymentStatus === 'held' && (
                          <button
                            id={`buyer-release-escrow-btn-${ord.id}`}
                            onClick={() => setEscrowModalOrder(ord)}
                            disabled={releasingId === ord.id}
                            className="mt-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            <span>Confirm Delivery & Release Escrow</span>
                          </button>
                        )}

                        {user?.role === 'buyer' && ord.status === 'delivered' && (
                          <div className="flex flex-col items-end gap-2 mt-2">
                            <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Received & Escrow Settled</span>
                            </span>
                            <button
                              id={`buyer-view-receipt-btn-${ord.id}`}
                              onClick={() => setSettlementReceiptOrder(ord)}
                              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-slate-600" />
                              <span>View Settlement Receipt</span>
                            </button>
                          </div>
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

      {/* Floating Action Feedback Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-red-900 text-red-100 border-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 text-slate-300 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Buyer: Confirm Pickup Farm Gate In-App Modal */}
      {pickupModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                    Consignment Farm Gate Handoff
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Confirm Produce Pickup
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPickupModalOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Brief */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Order Reference</span>
                <span className="font-mono font-bold text-slate-900">#{pickupModalOrder.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Produce Item</span>
                <span className="font-bold text-slate-900">{pickupModalOrder.cropName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Quantity & Rate</span>
                <span className="font-semibold text-slate-800">
                  {pickupModalOrder.quantityKg.toLocaleString()} KG @ ₹{pickupModalOrder.agreedPricePerKg || (pickupModalOrder as any).unitPricePerKg}/kg
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Escrow Value</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  ₹{pickupModalOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Farm Gate Location */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Farm Gate Pickup Point</span>
              </div>
              <p className="text-slate-700 pl-5">{pickupModalOrder.pickupAddress}</p>
              <div className="text-slate-600 pl-5 pt-1 flex items-center gap-2">
                <span>Farmer: <strong>{pickupModalOrder.farmerName}</strong></span>
                {pickupModalOrder.buyerPhone && (
                  <span className="text-slate-400">|</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              ℹ️ By confirming, you verify that the produce consignment has been received and loaded for transport. The status will update to <strong>In Transit</strong> and the farmer will receive an automated dispatch notification.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPickupModalOrder(null)}
                disabled={updatingId === pickupModalOrder.id}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-confirm-pickup-btn"
                onClick={() => handleConfirmPickupSubmit(pickupModalOrder)}
                disabled={updatingId === pickupModalOrder.id}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>{updatingId === pickupModalOrder.id ? 'Confirming...' : 'Confirm Pickup & Start Transit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buyer: Release Escrow Payment In-App Modal */}
      {escrowModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                    Escrow Settlement Authorization
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Confirm Delivery & Release Escrow
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setEscrowModalOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                <span className="text-emerald-800">Settlement Amount</span>
                <span className="font-mono font-black text-emerald-950 text-base">
                  ₹{escrowModalOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Beneficiary Farmer</span>
                <span className="font-bold text-slate-900">{escrowModalOrder.farmerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Produce</span>
                <span className="font-semibold text-slate-800">
                  {escrowModalOrder.quantityKg.toLocaleString()} KG {escrowModalOrder.cropName}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              🔒 Confirming delivery acknowledges that the consignment has arrived at {escrowModalOrder.deliveryAddress}, passed quality inspection, and releases ₹{escrowModalOrder.totalAmount.toLocaleString('en-IN')} directly to farmer {escrowModalOrder.farmerName}.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEscrowModalOrder(null)}
                disabled={releasingId === escrowModalOrder.id}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-release-escrow-btn"
                onClick={() => handleReleaseEscrowSubmit(escrowModalOrder)}
                disabled={releasingId === escrowModalOrder.id}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{releasingId === escrowModalOrder.id ? 'Releasing Funds...' : 'Authorize & Release Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Farmer Delivery & Direct Settlement Handover Modal */}
      {farmerDeliveryModalOrder && (
        <FarmerDeliveryModal
          isOpen={true}
          order={farmerDeliveryModalOrder}
          onClose={() => setFarmerDeliveryModalOrder(null)}
          onSuccess={handleFarmerDeliverySuccess}
        />
      )}

      {/* Escrow Settlement Receipt Voucher */}
      {settlementReceiptOrder && (
        <SettlementReceiptModal
          isOpen={true}
          order={settlementReceiptOrder}
          onClose={() => setSettlementReceiptOrder(null)}
        />
      )}
    </div>
  );
};
