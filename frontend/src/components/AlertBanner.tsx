'use client';

import React from 'react';
import { AnomalyEvent } from '../types';
import { AlertTriangle, ShieldAlert, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertBannerProps {
  alerts: AnomalyEvent[];
  onAcknowledge: (eventId: string) => void;
  onOpenDetail?: (alert: AnomalyEvent) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onAcknowledge, onOpenDetail }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 font-sans">
      {alerts.map(alert => {
        const isCritical = alert.severity === 'critical';
        const isHigh = alert.severity === 'high';

        return (
          <div
            key={alert.eventId}
            className={cn(
              "p-4 rounded-2xl border transition-all shadow-sm",
              isCritical
                ? "border-rose-300 bg-rose-50/70 text-slate-800"
                : isHigh
                ? "border-amber-300 bg-amber-50/70 text-slate-800"
                : "border-slate-200 bg-white"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {isCritical ? (
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5 animate-bounce" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider",
                      isCritical
                        ? "border-rose-300 bg-rose-100 text-rose-800"
                        : "border-amber-300 bg-amber-100 text-amber-800"
                    )}>
                      {alert.severity} Alert
                    </span>
                    <span className="text-xs font-mono text-slate-600 font-semibold">
                      {alert.detectorName} v{alert.detectorVersion}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(alert.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="mt-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                    {alert.explanation}
                  </p>

                  {alert.recommendedAction && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2 shadow-sm">
                      <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-sky-700">Recommended Action: </strong>
                        <span>{alert.recommendedAction}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onOpenDetail && (
                  <button
                    onClick={() => onOpenDetail(alert)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors shadow-sm"
                  >
                    Details
                  </button>
                )}
                <button
                  onClick={() => onAcknowledge(alert.eventId)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-mono text-emerald-800 font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
