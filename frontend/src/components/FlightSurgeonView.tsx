'use client';

import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Clock,
  Send,
  FileDown,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AnomalyItem {
  id: string;
  event_id?: string;
  astronaut_id: string;
  detector_name: string;
  detector_version: string;
  detected_at: string;
  severity: string;
  status: string;
  anomaly_score?: number;
  explanation: string;
  recommended_action?: string;
  data_quality_summary: Record<string, any>;
  reviews: Array<{
    id: string;
    reviewer_name: string;
    action: string;
    notes?: string;
    reviewed_at: string;
  }>;
}

interface FlightSurgeonViewProps {
  token: string | null;
  onRefresh: () => void;
}

export const FlightSurgeonView: React.FC<FlightSurgeonViewProps> = ({ token, onRefresh }) => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [reviewAction, setReviewAction] = useState('acknowledged');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [selectedCrew, setSelectedCrew] = useState('11111111-1111-1111-1111-111111111111');

  const crewRoster = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Alex Vance', callsign: 'ARES-LEAD', role: 'Mission Commander', status: 'MONITORED' },
    { id: '22222222-2222-2222-2222-222222222223', name: 'Dr. Sarah Chen', callsign: 'DISCOVERY-2', role: 'Flight Engineer', status: 'NOMINAL' },
    { id: '33333333-3333-3333-3333-333333333334', name: 'Mark Watney', callsign: 'BOTANIST-1', role: 'Payload Specialist', status: 'NOMINAL' },
  ];

  const fetchSurgeonData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/surgeon/anomalies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data);
      }

      const auditRes = await fetch('http://localhost:8000/api/v1/surgeon/audit-logs?limit=25', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const logs = await auditRes.json();
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Error fetching surgeon data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeonData();
  }, [token]);

  const handleSubmitReview = async () => {
    if (!selectedAnomaly || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/surgeon/anomalies/${selectedAnomaly.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes || 'Flight Surgeon reviewed telemetry; astronaut vitals and cabin status monitored.'
        })
      });

      if (res.ok) {
        setSelectedAnomaly(null);
        setReviewNotes('');
        await fetchSurgeonData();
        onRefresh();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAnomalies = anomalies.filter(a => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Flight Surgeon Header Strip */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-mono font-bold tracking-tight text-slate-900">
                Flight Surgeon Telemetry Operations Center
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-semibold">
                Dr. Elena Rostova (JSC Flight Med)
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Mission: Ares V • Destination: Mars Orbital Injection • Earth Comm Delay: 14m 12s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const report = JSON.stringify({ mission: "Ares V", exported_at: new Date().toISOString(), crew_records: anomalies }, null, 2);
              const blob = new Blob([report], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ARES_V_SURGEON_REPORT_${Date.now()}.json`;
              a.click();
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-600" />
            <span>Export Clinical Report</span>
          </button>

          <button
            onClick={fetchSurgeonData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-mono text-white font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Poll Telemetry</span>
          </button>
        </div>
      </div>

      {/* Crew Health Roster Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {crewRoster.map(member => (
          <div
            key={member.id}
            onClick={() => setSelectedCrew(member.id)}
            className={cn(
              "p-4 rounded-2xl border cursor-pointer transition-all select-none shadow-sm",
              selectedCrew === member.id ? "border-sky-500 bg-sky-50/50 shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-900 block">{member.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{member.callsign} • {member.role}</span>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                member.status === 'ALERT' ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              )}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Alert Stream & Clinical Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Synchronized Mission Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-2 font-bold">
              <span>Synchronized Anomaly Stream</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-700">
                {filteredAnomalies.length} Events
              </span>
            </h3>

            {/* Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {(['all', 'critical', 'high'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "px-2 py-0.5 rounded uppercase text-[10px] transition-colors",
                    severityFilter === sev ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {filteredAnomalies.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center font-mono text-xs text-slate-500 shadow-sm">
              No synchronized anomalies recorded. Telemetry nominal for selected crew.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnomalies.map(anom => {
                const isCrit = anom.severity === 'critical';
                const isSelected = selectedAnomaly?.id === anom.id;

                return (
                  <div
                    key={anom.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all shadow-sm",
                      isSelected ? "border-sky-500 bg-sky-50/50" :
                      isCrit ? "border-rose-200 bg-rose-50/50" : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                            isCrit ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                          )}>
                            {anom.severity}
                          </span>
                          <span className="text-xs font-mono text-slate-900 font-bold">
                            {anom.detector_name}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            Status: <strong className="uppercase text-slate-800">{anom.status}</strong>
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(anom.detected_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {anom.explanation}
                        </p>

                        {anom.reviews && anom.reviews.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-emerald-700 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                            <div>
                              <span>Cleared by {anom.reviews[0].reviewer_name} • Action: <strong>{anom.reviews[0].action}</strong></span>
                              {anom.reviews[0].notes && (
                                <p className="text-slate-500 italic text-[11px] mt-0.5 font-sans">
                                  "{anom.reviews[0].notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedAnomaly(anom)}
                        className="shrink-0 px-3.5 py-1.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-xs font-mono text-sky-800 font-bold transition-colors shadow-sm"
                      >
                        Action & Clear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Clinical Action & Audit Trail */}
        <div className="space-y-6">
          {selectedAnomaly ? (
            <div className="p-5 rounded-2xl border border-sky-300 bg-white shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-sky-700 font-bold">
                  Surgeon Clinical Clearance
                </h4>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                Actioning: <span className="text-slate-900 font-bold">{selectedAnomaly.detector_name}</span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 font-medium">Clinical Disposition</label>
                <select
                  value={reviewAction}
                  onChange={e => setReviewAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="acknowledged">Acknowledge & Continue Remote Monitoring</option>
                  <option value="under_review">Order Supplemental O2 Protocol (NASA-STD-3001v1)</option>
                  <option value="resolved">Clinical Resolution Confirmed (Normalcy Restored)</option>
                  <option value="dismissed">Dismiss (Verified Sensor Artifact)</option>
                </select>
              </div>

              {/* Directive Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500">Preset Directives:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReviewNotes("Order 30 min supplemental O2 via mask; re-check SpO2 at 5-minute intervals.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-700 border border-slate-200"
                  >
                    + Supplemental O2 Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewNotes("Mandate immediate rest cycle; defer non-critical EVA maintenance.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-700 border border-slate-200"
                  >
                    + Rest Cycle Mandate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 font-medium">Physician Orders & Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Enter medical rationale or instructions to flight crew..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Transmitting...' : 'Sign & Transmit Directive'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Audit Log Panel */
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 flex items-center gap-2 font-bold">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tamper-Evident Audit Trail</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">SHA-256 Ledger</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-sky-700 font-bold">{log.action}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(log.occurred_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] mt-1 flex items-center justify-between">
                      <span>Entity: {log.entity_type}</span>
                      <span className="text-emerald-700 font-bold uppercase">OUTCOME: {log.outcome}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
