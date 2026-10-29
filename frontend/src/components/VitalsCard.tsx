'use client';

import React from 'react';
import { Heart, Activity, Wind, Moon, BatteryWarning, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface VitalsCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: 'nominal' | 'warning' | 'critical' | 'learning';
  statusLabel?: string;
  iconName: 'heart' | 'bp' | 'spo2' | 'sleep' | 'fatigue';
  baselineInfo?: string;
  deviationZ?: number;
  trend?: 'up' | 'down' | 'stable';
  secondaryMetric?: { label: string; value: string };
  onClick?: () => void;
}

export const VitalsCard: React.FC<VitalsCardProps> = ({
  title,
  value,
  unit,
  status,
  statusLabel,
  iconName,
  baselineInfo,
  deviationZ,
  trend = 'stable',
  secondaryMetric,
  onClick
}) => {
  const getIcon = () => {
    switch (iconName) {
      case 'heart':
        return <Heart className={cn("w-4 h-4 text-rose-500", status === 'critical' ? 'animate-ping' : 'animate-pulse')} />;
      case 'bp':
        return <Activity className="w-4 h-4 text-sky-600" />;
      case 'spo2':
        return <Wind className={cn("w-4 h-4 text-cyan-600", status === 'critical' && 'text-rose-600')} />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'fatigue':
        return <BatteryWarning className={cn("w-4 h-4 text-amber-500", status === 'warning' && 'animate-bounce')} />;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'critical':
        return 'border-rose-300 bg-rose-50/50 text-rose-700 shadow-sm';
      case 'warning':
        return 'border-amber-300 bg-amber-50/50 text-amber-700 shadow-sm';
      case 'learning':
        return 'border-sky-300 bg-sky-50/40 text-sky-700';
      default:
        return 'border-slate-200 bg-white text-emerald-700 hover:border-slate-300 shadow-sm';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-2xl border transition-all duration-200 select-none cursor-pointer overflow-hidden hover:shadow-md",
        getStatusStyles()
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
            {getIcon()}
          </div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500 group-hover:text-slate-800 transition-colors">
            {title}
          </span>
        </div>

        {/* Status Pill */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider font-semibold",
          status === 'critical' ? 'bg-rose-100 border-rose-200 text-rose-700' :
          status === 'warning' ? 'bg-amber-100 border-amber-200 text-amber-700' :
          status === 'learning' ? 'bg-sky-100 border-sky-200 text-sky-700' :
          'bg-emerald-100 border-emerald-200 text-emerald-700'
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === 'critical' ? 'bg-rose-600 animate-ping' :
            status === 'warning' ? 'bg-amber-600' :
            status === 'learning' ? 'bg-sky-600' :
            'bg-emerald-600'
          )} />
          <span>{statusLabel || (status === 'nominal' ? 'NOMINAL' : status)}</span>
        </div>
      </div>

      {/* Primary Value Display */}
      <div className="flex items-baseline justify-between mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
          <span className="text-xs font-mono text-slate-500">
            {unit}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-rose-600" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-sky-600" />}
          {trend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          {deviationZ !== undefined && deviationZ > 0 && (
            <span className={cn(
              "text-[10px]",
              deviationZ >= 3 ? "text-rose-600 font-bold" : "text-slate-500"
            )}>
              {deviationZ > 0 ? `+${deviationZ.toFixed(1)}σ` : `${deviationZ.toFixed(1)}σ`}
            </span>
          )}
        </div>
      </div>

      {/* Baseline / Secondary Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="text-slate-400">Baseline Ref</span>
        <span className="text-slate-700 font-medium">{baselineInfo || 'Model Learning'}</span>
      </div>

      {secondaryMetric && (
        <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>{secondaryMetric.label}</span>
          <span className="text-slate-700 font-medium">{secondaryMetric.value}</span>
        </div>
      )}
    </div>
  );
};
