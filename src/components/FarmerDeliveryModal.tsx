import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Truck,
  ShieldCheck,
  Landmark,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, Payment } from '../types';

interface FarmerDeliveryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  order: Order & { payment?: Payment };
  onSuccess: (updatedOrder: Order & { payment?: Payment }) => void;
}

export const FarmerDeliveryModal: React.FC<FarmerDeliveryModalProps> = ({
  isOpen = true,
  onClose,
  order,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [settlementMethod, setSettlementMethod] = useState<'bank_dbt' | 'upi_instant' | 'mandi_gate'>('bank_dbt');
  const [acknowledged, setAcknowledged] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      setError('Please acknowledge that consignment handover has taken place.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || '';
      const savedUserStr = localStorage.getItem('krishimitra_user') || localStorage.getItem('agriconnect_user');
      let userId = '';
      if (savedUserStr) {
        try {
          userId = JSON.parse(savedUserStr).id;
        } catch (_) {}
      }

      const channelLabel =
        settlementMethod === 'upi_instant'
          ? 'Instant UPI Auto-Disburse (NPCI Fast-Pay)'
          : settlementMethod === 'mandi_gate'
          ? 'Authorized Mandi Gate Escrow Counter'
          : 'Direct DBT Bank Transfer / RTGS';

      const res = await fetch(`/api/orders/${order.id}/release-escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          deliveryRemarks: remarks.trim() || 'Produce handed over and accepted at destination. Escrow settled.',
          settlementRemarks: remarks.trim() || 'Produce handed over and accepted at destination. Escrow settled.',
          settlementMethod: channelLabel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to settle escrow');
      }

      // Confetti celebration for the farmer's payout!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
        });
      } catch {
        // silent
      }

      const updated = data.order || {
        ...order,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        settlementRemarks: remarks.trim(),
        payment: data.payment || { ...order.payment, status: 'released' },
      };

      onSuccess(updated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error settling delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                Farmer Delivery Handover
              </span>
              <h3 className="font-extrabold text-lg text-slate-900">
                Confirm Final Delivery & Settle Payout
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payout & Order Summary Card */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
            <span className="text-emerald-900 font-bold">Total Direct Payout (0% Commission)</span>
            <span className="font-mono font-black text-emerald-950 text-lg">
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Produce Consignment</span>
            <span className="font-bold text-slate-900">
              {order.quantityKg.toLocaleString()} KG {order.cropName}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Buyer</span>
            <span className="font-semibold text-slate-800">{order.buyerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Destination</span>
            <span className="font-semibold text-slate-800 truncate max-w-[240px]">
              {order.deliveryAddress}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-emerald-200/40">
            <span className="text-slate-600">Disbursement Account</span>
            <span className="font-medium text-emerald-800 flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5" />
              State Bank of India (DBT linked)
            </span>
          </div>
        </div>

        {/* Handover Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Disbursement Channel Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Payout Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettlementMethod('bank_dbt')}
                className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                  settlementMethod === 'bank_dbt'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-emerald-700" /> Bank DBT
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">SBI Account (Direct IMPS)</span>
              </button>

              <button
                type="button"
                onClick={() => setSettlementMethod('upi_instant')}
                className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                  settlementMethod === 'upi_instant'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Instant UPI
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">NPCI VPA Auto-Disburse</span>
              </button>

              <button
                type="button"
                onClick={() => setSettlementMethod('mandi_gate')}
                className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                  settlementMethod === 'mandi_gate'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Mandi Gate
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">Escrow Counter Slip</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handover / Delivery Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Handed over at buyer warehouse in sound condition"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700 leading-snug">
              I verify that this consignment has reached the delivery point and handover to <strong>{order.buyerName}</strong> is complete. Release funds to my bank account.
            </span>
          </label>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Direct-to-bank escrow disbursement will be completed immediately. You can view or print the official settlement voucher right after.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !acknowledged}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submitting ? 'Settling Escrow...' : `Confirm Delivery & Disburse ₹${order.totalAmount.toLocaleString('en-IN')}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
