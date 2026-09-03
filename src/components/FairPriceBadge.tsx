import React from 'react';
import { ShieldCheck, TrendingDown, Sparkles } from 'lucide-react';

interface FairPriceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showDetail?: boolean;
  savingsVsRetail?: number;
  mandiModalPrice?: number;
}

export const FairPriceBadge: React.FC<FairPriceBadgeProps> = ({
  score,
  size = 'md',
  showDetail = false,
  savingsVsRetail,
  mandiModalPrice,
}) => {
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let label = 'Fair Market Price';

  if (score >= 90) {
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    label = 'Top Value Deal';
  } else if (score >= 75) {
    badgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
    label = 'Fair Market Value';
  } else if (score >= 60) {
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    label = 'Moderate Premium';
  } else {
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    label = 'High Markup';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <div className="inline-flex flex-col">
      <div
        className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${badgeColor} ${sizeClasses[size]}`}
      >
        <ShieldCheck className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Fair Price Index: {score}/100</span>
      </div>

      {showDetail && (
        <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-slate-500">Benchmark APMC Mandi:</span>
            <span className="font-semibold text-slate-800">
              {mandiModalPrice ? `₹${mandiModalPrice}/kg` : 'Live Agmarknet Avg'}
            </span>
          </div>
          {typeof savingsVsRetail === 'number' && savingsVsRetail > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-semibold">
              <span className="flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> Middleman Margin Saved:
              </span>
              <span>~₹{savingsVsRetail}/kg</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
