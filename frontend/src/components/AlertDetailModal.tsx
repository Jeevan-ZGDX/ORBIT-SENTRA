'use client';

import React, { useState } from 'react';
import { AnomalyEvent } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  CheckCircle2,
  X,
  Stethoscope,
  ExternalLink,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertDetailModalProps {
  alert: AnomalyEvent | null;
  onClose: () => void;
  onAcknowledge: (eventId: string, notes?: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onAcknowledge
}) => {
  const [ackNotes, setAckNotes] = useState('');

  if (!alert) return null;

  const isCritical = alert.severity === 'critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className={cn(
          "px-6 py-4 border-b flex items-center justify-between",
          isCritical ? "bg-rose-50/80 border-rose-200" : "bg-amber-50/80 border-amber-200"
        )}>
          <div className="flex items-center gap-3">
            {isCritical ? (
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider",
                  isCritical ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                )}>
                  {alert.severity} Alert
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Event: {alert.eventId.slice(0, 8)}...
                </span>
              </div>
              <h2 className="text-sm font-mono font-bold text-slate-900 mt-1">
                {alert.detectorName} (Unified Engine v{alert.detectorVersion})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Explanation */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
              Explainable Anomaly Assessment
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
              {alert.explanation}
            </div>
          </div>

          {/* Contributing Multi-Signal Evidence */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold">
              Contributing Signals & Contextual Evidence
            </h4>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Anomaly Score</span>
                <span className="text-lg font-bold text-slate-900">{alert.anomalyScore ?? 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Quality Gate</span>
                <span className="text-lg font-bold text-emerald-600">VERIFIED VALID</span>
              </div>
            </div>
          </div>

          {/* NASA Protocol Escalation Guidance */}
          {alert.recommendedAction && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between font-bold">
                <span>Clinical Escalation Protocol</span>
                <span className="text-[10px] text-sky-700 flex items-center gap-1 font-mono">
                  <ExternalLink className="w-3 h-3" />
                  NASA-STD-3001v1 Rev-C
                </span>
              </h4>
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-sans">{alert.recommendedAction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Astronaut Acknowledgement & Notes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
              Astronaut Operational Notes
            </label>
            <textarea
              value={ackNotes}
              onChange={e => setAckNotes(e.target.value)}
              placeholder="e.g., Donned supplemental O2 mask; dyspnea improving. Vital signs re-check in 5 minutes."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>Persisted in local Dexie store</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors shadow-sm"
            >
              Close
            </button>
            <button
              onClick={() => {
                onAcknowledge(alert.eventId, ackNotes);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-mono text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sign & Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
