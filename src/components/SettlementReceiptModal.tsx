import React, { useRef } from 'react';
import {
  CheckCircle2,
  X,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  Truck,
  Download,
  Receipt,
  Sparkles,
  MapPin,
  Landmark,
} from 'lucide-react';
import { Order, Payment } from '../types';

interface SettlementReceiptModalProps {
  isOpen?: boolean;
  onClose: () => void;
  order: Order & { payment?: Payment };
}

export const SettlementReceiptModal: React.FC<SettlementReceiptModalProps> = ({
  isOpen = true,
  onClose,
  order,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const payment = order.payment;
  const utrRef = payment?.transactionRef || `UTR-ESCROW-${order.id.replace(/\D/g, '').slice(-8) || '94821037'}`;
  const settlementDate = payment?.releasedAt || order.deliveredAt || new Date().toISOString();
  const mandiSaved = Math.round(order.totalAmount * 0.06);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptText = `
======================================================
 KRISHIMITRA AGRICONNECT - ESCROW SETTLEMENT VOUCHER
======================================================
Voucher Ref: ${utrRef}
Order ID: #${order.id}
Settlement Date: ${new Date(settlementDate).toLocaleString('en-IN')}
Status: DELIVERED & SETTLED (100% DISBURSED)

BENEFICIARY (FARMER / SELLER):
Name: ${order.farmerName}
Disbursement Method: Direct DBT / Jan Dhan Linked Bank Transfer
Bank: State Bank of India •••• 4819 (IFSC: SBIN0001092)
Pickup Farm Gate: ${order.pickupAddress}

BUYER DETAILS:
Name: ${order.buyerName}
Destination: ${order.deliveryAddress}

CONSIGNMENT DETAILS:
Commodity: ${order.cropName}
Quantity: ${order.quantityKg.toLocaleString()} KG (${(order.quantityKg / 100).toFixed(1)} Quintals)
Agreed Direct Rate: ₹${order.agreedPricePerKg || Math.round(order.totalAmount / order.quantityKg)}/kg
Gross Produce Value: ₹${order.totalAmount.toLocaleString('en-IN')}

SETTLEMENT BREAKDOWN:
Gross Escrow Amount: ₹${order.totalAmount.toLocaleString('en-IN')}
Mandi Intermediary Dalal Cut: ₹0 (Zero Commission Model)
Platform Convenience Fee: ₹0
------------------------------------------------------
NET CREDITED TO FARMER: ₹${order.totalAmount.toLocaleString('en-IN')}
Total Brokerage Saved vs Traditional Mandi: ₹${mandiSaved.toLocaleString('en-IN')}
------------------------------------------------------
Handover Remarks: ${order.settlementRemarks || payment?.deliveryRemarks || 'Consignment verified, inspected, and handed over in full.'}
Verification: Smart Escrow Vault Release Protocol Authenticated.
======================================================
`;

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Settlement-Receipt-Order-${order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:m-0 print:max-w-none">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Escrow Settlement Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Voucher"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Text Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  KrishiMitra AgriConnect
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Settled to Farmer
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Farm Produce Settlement Voucher
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct-to-Buyer Escrow Disbursement Certificate • Zero Middleman Cut
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Settlement Reference</div>
              <div className="font-mono text-xs font-black text-slate-800">{utrRef}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex sm:justify-end items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(settlementDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Major Hero Amount Credited Card */}
          <div className="p-6 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-300" />
                  Net Payout Credited to Farmer Account
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono mt-1 text-white tracking-tight">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-emerald-100/90 mt-1">
                  Transferred via DBT to {order.farmerName} • 100% of agreed value
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-right shrink-0">
                <div className="text-[10px] text-emerald-200 uppercase font-bold">Mandi Brokerage Saved</div>
                <div className="text-base font-black text-amber-300 font-mono">
                  +₹{mandiSaved.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-200">0% Commission Model</div>
              </div>
            </div>
          </div>

          {/* Party Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farmer / Seller (Beneficiary) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Beneficiary (Seller / Farmer)
              </div>
              <p className="text-sm font-black text-slate-900">{order.farmerName}</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">Farm Gate: {order.pickupAddress}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Account: State Bank of India ••••4819 (IFSC: SBIN0001092)</span>
                </p>
              </div>
            </div>

            {/* Buyer (Payer) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Payer (Direct Buyer)
              </div>
              <p className="text-sm font-black text-slate-900">{order.buyerName}</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="flex items-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">Destination: {order.deliveryAddress}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Consignment Received & Handover Accepted</span>
                </p>
              </div>
            </div>
          </div>

          {/* Consignment & Commercial Itemization Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 p-3 text-xs font-bold text-slate-700 grid grid-cols-12 gap-2">
              <div className="col-span-6">Harvest Produce Item</div>
              <div className="col-span-3 text-right">Quantity</div>
              <div className="col-span-3 text-right">Settled Total</div>
            </div>
            <div className="p-4 divide-y divide-slate-100 text-xs">
              <div className="grid grid-cols-12 gap-2 py-2 items-center">
                <div className="col-span-6">
                  <div className="font-bold text-slate-900 text-sm">{order.cropName}</div>
                  <div className="text-slate-500 text-[11px]">
                    Direct farm consignment • Agreed rate: ₹{order.agreedPricePerKg || Math.round(order.totalAmount / order.quantityKg)}/kg
                  </div>
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-800">
                  {order.quantityKg.toLocaleString()} KG
                  <div className="text-[10px] text-slate-500 font-normal">
                    ({(order.quantityKg / 100).toFixed(1)} Quintals)
                  </div>
                </div>
                <div className="col-span-3 text-right font-mono font-black text-slate-900 text-sm">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Deductions line items */}
              <div className="grid grid-cols-12 gap-2 py-2 text-slate-600 text-[11px]">
                <div className="col-span-9">Mandi Agent Commission (Dalal Shulk)</div>
                <div className="col-span-3 text-right font-mono font-bold text-emerald-600">₹0 (Waived)</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 text-slate-600 text-[11px]">
                <div className="col-span-9">Platform Escrow Clearance Fee</div>
                <div className="col-span-3 text-right font-mono font-bold text-emerald-600">₹0 (Free)</div>
              </div>

              {/* Total final */}
              <div className="grid grid-cols-12 gap-2 pt-3 font-bold text-sm text-slate-900 border-t border-slate-200">
                <div className="col-span-6 font-extrabold">Final Disbursed Payout</div>
                <div className="col-span-6 text-right font-mono font-black text-emerald-700 text-base">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Handover Remarks & Smart Escrow Seal */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Smart Escrow Final Settlement Verification</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Audit Trail Recorded
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Handover Note:</strong> {order.settlementRemarks || payment?.deliveryRemarks || 'The harvest produce has completed transportation, passed gate inspection, and funds have been released to the seller account.'}
            </p>
            <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Timestamp: {new Date(settlementDate).toLocaleString('en-IN')}</span>
              <span className="font-mono text-emerald-800 font-bold">Status: SETTLED_RELEASED_TO_FARMER</span>
            </div>
          </div>

          {/* Bottom Stamp & Print Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>Computer generated receipt • No physical signature required</span>
            </div>
            <div className="font-bold text-slate-600">KrishiMitra Direct Mart v2.4</div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Receipt
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
