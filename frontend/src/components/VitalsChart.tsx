'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { Activity, Wind, Eye, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChartPoint {
  time: string;
  heartRate: number;
  spo2: number;
}

interface VitalsChartProps {
  data: ChartPoint[];
  metric: 'heart_rate' | 'spo2';
  baselineMedian?: number;
  baselineLower?: number;
  baselineUpper?: number;
  onMetricToggle?: (metric: 'heart_rate' | 'spo2') => void;
}

export const VitalsChart: React.FC<VitalsChartProps> = ({
  data,
  metric,
  baselineMedian,
  baselineLower,
  baselineUpper,
  onMetricToggle
}) => {
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h'>('1h');
  const isHR = metric === 'heart_rate';
  const unit = isHR ? 'bpm' : '%';
  const minDomain = isHR ? 45 : 80;
  const maxDomain = isHR ? 140 : 100;
  const strokeColor = isHR ? '#ff3366' : '#00f2fe';
  const gradientId = isHR ? 'hrGradient' : 'spo2Gradient';

  return (
    <div className="w-full rounded-xl border border-white/10 hud-glass p-5 transition-all">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg border",
            isHR ? "bg-hud-rose/10 border-hud-rose/30 text-hud-rose" : "bg-hud-cyan/10 border-hud-cyan/30 text-hud-cyan"
          )}>
            {isHR ? <Activity className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                {isHR ? 'Continuous Electrocardiography / Heart Rate' : 'Pulse Oximetry / Oxygen Saturation (SpO₂)'}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                1Hz Telemetry
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Source: Bio-Monitor Vest Ch-1 • Quality: <span className="text-emerald-400 font-bold">VALID (SNR 98%)</span>
            </p>
          </div>
        </div>

        {/* Time Window & Metric Switcher */}
        <div className="flex items-center gap-2">
          {onMetricToggle && (
            <div className="flex items-center rounded-lg bg-space-950/80 border border-white/10 p-1 text-xs font-mono">
              <button
                onClick={() => onMetricToggle('spo2')}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors text-[11px]",
                  !isHR ? "bg-hud-cyan/20 text-hud-cyan font-bold border border-hud-cyan/40" : "text-slate-400 hover:text-white"
                )}
              >
                SpO₂
              </button>
              <button
                onClick={() => onMetricToggle('heart_rate')}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors text-[11px]",
                  isHR ? "bg-hud-rose/20 text-hud-rose font-bold border border-hud-rose/40" : "text-slate-400 hover:text-white"
                )}
              >
                Heart Rate
              </button>
            </div>
          )}

          <div className="flex items-center rounded-lg bg-space-950/80 border border-white/10 p-1 text-[11px] font-mono text-slate-400">
            {(['15m', '1h', '6h'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors",
                  timeRange === range ? "bg-white/10 text-white font-bold" : "hover:text-slate-300"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Baseline Status Ribbon */}
      {baselineMedian !== undefined && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-space-950/60 border border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-hud-cyan" />
            <span>Personal Baseline Median: <strong className="text-white">{baselineMedian}{unit}</strong></span>
          </div>
          {baselineLower !== undefined && baselineUpper !== undefined && (
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2.5 h-1 bg-hud-teal/40 rounded-sm inline-block"></span>
              <span>Nominal Envelope (±3σ MAD): <strong className="text-slate-200">{baselineLower} – {baselineUpper}{unit}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#162238" vertical={false} />
            
            <XAxis
              dataKey="time"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              stroke="#475569"
              fontSize={10}
              domain={[minDomain, maxDomain]}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#080d1a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(val: any) => [`${val} ${unit}`, isHR ? 'Heart Rate' : 'SpO2']}
            />

            {/* Shaded Normal Baseline Region */}
            {baselineLower !== undefined && baselineUpper !== undefined && (
              <ReferenceArea
                y1={baselineLower}
                y2={baselineUpper}
                fill="#38bdf8"
                fillOpacity={0.07}
              />
            )}

            {/* Clinical Critical Threshold Line for SpO2 */}
            {!isHR && (
              <ReferenceLine
                y={90}
                stroke="#ff3366"
                strokeDasharray="4 4"
                label={{ value: 'CRITICAL HYPOXIA (90%)', fill: '#ff3366', fontSize: 9, position: 'insideTopRight' }}
              />
            )}

            <Area
              type="monotone"
              dataKey={isHR ? 'heartRate' : 'spo2'}
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
