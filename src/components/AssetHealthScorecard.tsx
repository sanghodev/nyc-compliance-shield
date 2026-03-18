import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Home, Info, AlertCircle, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface AssetHealthScorecardProps {
  marketData: {
    property?: {
      price?: number;
      rent_estimate?: number;
      message?: string;
    };
    neighborhood?: {
      median_income: number;
      rent_trend: string;
      market_status: string;
    };
  } | null;
  loading: boolean;
  violationCount: number;
}

export const AssetHealthScorecard: React.FC<AssetHealthScorecardProps> = ({ marketData, loading, violationCount }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-slate-800 rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-800 rounded-xl"></div>
          <div className="h-16 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const estimatedValueLoss = violationCount * 2500; // Mock calculation: $2,500 per open violation
  const hasPrice = marketData?.property?.price && marketData.property.price > 0;
  const hasRent = marketData?.property?.rent_estimate && marketData.property.rent_estimate > 0;
  
  // Calculate Financial Metrics
  const grossRentYearly = hasRent ? marketData!.property!.rent_estimate! * 12 : 0;
  const estimatedOpEx = grossRentYearly * 0.40; // 40% OpEx Ratio
  const noi = grossRentYearly - estimatedOpEx;
  
  const rentalYield = (hasPrice && hasRent) 
    ? (grossRentYearly / marketData.property!.price!) * 100 
    : null;

  const capRate = (hasPrice && noi > 0)
    ? (noi / marketData.property!.price!) * 100
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 font-bold text-lg text-white">
        <TrendingUp className="w-5 h-5 text-emerald-400" /> Asset Health & ROI
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market Value Card */}
        <Card className="bg-slate-900 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
              <DollarSign className="w-3 h-3" /> Estimated Market Value
            </div>
            <div className="text-xl font-bold text-white">
              {hasPrice ? `$${marketData.property!.price!.toLocaleString()}` : "Contact for Evaluation"}
            </div>
            {violationCount > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded-full w-fit">
                <AlertCircle className="w-3 h-3" />
                Est. -${estimatedValueLoss.toLocaleString()} (Compliance Risk)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rent Potential Card */}
        <Card className="bg-slate-900 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
              <Home className="w-3 h-3" /> Rent Estimate
            </div>
            <div className="text-xl font-bold text-sky-400">
              {hasRent ? `$${marketData!.property!.rent_estimate!.toLocaleString()}/mo` : "N/A"}
            </div>
            <div className="mt-2 text-[9px] text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Area: {marketData?.neighborhood?.rent_trend || "Stable"}
            </div>
          </CardContent>
        </Card>

        {/* NOI Card */}
        <Card className="bg-slate-900 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
              <Activity className="w-3 h-3" /> Net Operating Income (NOI)
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {noi > 0 ? `$${Math.round(noi).toLocaleString()}/yr` : "N/A"}
            </div>
            <div className="mt-2 text-[9px] text-slate-500 italic">
              Est. 40% OpEx Ratio applied
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Yields Comparison */}
        <Card className="bg-slate-900/50 border-slate-800 p-4">
           <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Investment Yields</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">Performance</Badge>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Gross Rental Yield</span>
                <span className="text-sm font-bold text-white">{rentalYield ? `${rentalYield.toFixed(1)}%` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Estimated Cap Rate</span>
                <span className="text-sm font-bold text-sky-400">{capRate ? `${capRate.toFixed(1)}%` : "N/A"}</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min((capRate || 0) * 10, 100)}%` }}></div>
              </div>
           </div>
        </Card>

        {/* Demographics Card */}
        <Card className="bg-slate-900/50 border-slate-800 p-4">
           <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Neighborhood DNA</span>
              <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400">Real-Time Census</Badge>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Median HH Income</span>
                <span className="text-sm font-bold text-white">
                  {marketData?.neighborhood?.median_income 
                    ? `$${marketData.neighborhood.median_income.toLocaleString()}` 
                    : "Connecting..."}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Market Rent Trend</span>
                <span className={`text-sm font-bold ${marketData?.neighborhood?.rent_trend === 'Rising' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {marketData?.neighborhood?.rent_trend || "Analyzing..."}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" /> Based on 2022 ACS 5-Year Data
              </div>
           </div>
        </Card>
      </div>

      {/* Neighborhood Insight */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white mb-1">Neighborhood Insight</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This building is in a <span className="text-white font-bold">{marketData?.neighborhood?.market_status || "Dynamic"}</span> market zone. 
              {violationCount > 0 
                ? " Resolving current violations could unlock significant equity and increase potential rental yields by up to 12%."
                : " Maintaining its current compliance profile is optimal for asset preservation and appraisal value."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
