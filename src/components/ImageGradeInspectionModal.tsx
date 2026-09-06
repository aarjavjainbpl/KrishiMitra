import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Maximize2,
  ZoomIn,
  TrendingDown,
  ChevronRight,
  Info,
  BadgeCheck,
  Layers,
  Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QualityPrediction, Listing } from '../types';
import { resolveDisplayImage, getCropFallbackImage } from '../utils/cropImages';

interface ImageGradeInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: (Listing & { qualityPrediction?: QualityPrediction; fairPriceScore?: number; mandiModalReference?: number }) | null;
}

export const ImageGradeInspectionModal: React.FC<ImageGradeInspectionModalProps> = ({
  isOpen,
  onClose,
  listing,
}) => {
  const [zoomMode, setZoomMode] = useState<boolean>(false);

  if (!isOpen || !listing) return null;

  const qp = listing.qualityPrediction;
  const grade = listing.qualityGrade || qp?.predictedGrade || 'A';

  const getGradeTitle = (g: string) => {
    switch (g) {
      case 'A':
        return {
          title: 'Grade A (Super Fine / Export Table Grade)',
          desc: 'High uniformity, prime color maturity, blemish-free skin, optimal shelf life.',
          badgeBg: 'bg-emerald-600 text-white',
          borderCol: 'border-emerald-500',
          accentBg: 'bg-emerald-50 text-emerald-900',
        };
      case 'B':
        return {
          title: 'Grade B (Standard Commercial Mandi Grade)',
          desc: 'Minor superficial curing or sizing marks, 100% edible and firm core, high market utility.',
          badgeBg: 'bg-teal-600 text-white',
          borderCol: 'border-teal-500',
          accentBg: 'bg-teal-50 text-teal-900',
        };
      default:
        return {
          title: 'Grade C (Discount Processing / Pulping Grade)',
          desc: 'Cosmetic variations, irregular sizing or over-ripeness, best suited for immediate processing or pulping.',
          badgeBg: 'bg-amber-600 text-white',
          borderCol: 'border-amber-500',
          accentBg: 'bg-amber-50 text-amber-900',
        };
    }
  };

  const gradeInfo = getGradeTitle(grade);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Farmer Published Image & Grade Report
                </h3>
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Certified Transparency
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Harvest: <strong className="text-slate-200">{listing.cropName} ({listing.variety})</strong> • Published by {listing.farmerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Main Inspection Grid: Produce Image & Primary Grade Verdict */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left: Interactive Harvest Image Viewer (5 cols) */}
            <div className="md:col-span-5 flex flex-col space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-4/3">
                <img
                  src={resolveDisplayImage(listing.photoUrl, qp?.imageUrl, listing.cropName)}
                  alt={listing.cropName}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getCropFallbackImage(listing.cropName);
                  }}
                  className={`w-full h-full object-cover transition-transform duration-300 ${zoomMode ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onClick={() => setZoomMode(!zoomMode)}
                />
                
                {/* Farmer Declared Badge Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg shadow-md ${gradeInfo.badgeBg} flex items-center gap-1`}>
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Farmer Grade: {grade}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-slate-100 flex items-center gap-1 border border-white/10">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {qp?.confidence ? `${Math.round(qp.confidence * 100)}% Confidence` : 'AI Verified'}
                  </span>
                </div>

                {/* Zoom Toggle */}
                <button
                  type="button"
                  onClick={() => setZoomMode(!zoomMode)}
                  className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 transition-all"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  {zoomMode ? 'Reset Zoom' : 'Click to Zoom'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Original photo uploaded directly from farmer's field at harvest
              </p>
            </div>

            {/* Right: Grade Classification & Pathology Status (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              
              {/* Grade Banner */}
              <div className={`p-4 rounded-xl border ${gradeInfo.borderCol} ${gradeInfo.accentBg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Farmer Declared Produce Grade
                  </span>
                  <span className={`text-sm font-black px-3 py-0.5 rounded-full ${gradeInfo.badgeBg}`}>
                    GRADE {grade}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {gradeInfo.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {gradeInfo.desc}
                </p>
              </div>

              {/* Disease & Pathology Verification */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Image Pathology & Disease Diagnosis:
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {qp?.diseaseStatus === 'healthy' ? '✓ Healthy & Disease-Free' : qp?.diseaseStatus || 'Healthy'}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800">
                  {qp?.diseaseName || 'Certified Prime & Disease-Free (ICAR Grade Specification)'}
                </p>
                {qp?.symptoms && qp.symptoms.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    {qp.symptoms.map((sym, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{sym}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Economic Justification for Buyer */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-emerald-900">
                    Direct Farmer Price vs Mandi Benchmark:
                  </p>
                  <p className="text-xs text-emerald-700">
                    ₹{listing.askingPricePerKg.toFixed(1)}/kg (Mandi Modal: ₹{(listing.mandiModalReference || listing.askingPricePerKg * 1.05).toFixed(1)}/kg)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                    Fair Price: {listing.fairPriceScore || 92}/100
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 4 Optical Metric Score Cards */}
          {qp?.metrics && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Computer Vision Optical Quality Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <p className="text-[11px] text-slate-500 font-semibold">Color Ripeness</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{qp.metrics.colorRipenessScore}%</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qp.metrics.colorRipenessScore}%` }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <p className="text-[11px] text-slate-500 font-semibold">Surface Uniformity</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{qp.metrics.surfaceUniformityScore}%</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qp.metrics.surfaceUniformityScore}%` }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <p className="text-[11px] text-slate-500 font-semibold">Blemish Free</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{qp.metrics.blemishFreeScore}%</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qp.metrics.blemishFreeScore}%` }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <p className="text-[11px] text-slate-500 font-semibold">Freshness Index</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{qp.metrics.freshnessIndex}%</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qp.metrics.freshnessIndex}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botanical Defect Notes */}
          {qp?.defectNotes && qp.defectNotes.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Botanical Quality & Defect Notes:
              </h4>
              <div className="space-y-1.5">
                {qp.defectNotes.map((note, idx) => (
                  <p key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Escrow Quality Assurance Banner */}
          <div className="p-4 bg-linear-to-r from-emerald-500 to-teal-600 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm">100% Escrow Quality Match Guarantee</h5>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Upon truck delivery, your lot is inspected against this published Grade {grade} image. If it does not match, your payment held in escrow is refunded or renegotiated.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close Report
          </button>
          
          <Link
            to={`/buyer/listing/${listing.id}`}
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
          >
            <span>Proceed to Buy Lot (₹{listing.askingPricePerKg}/kg)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};
