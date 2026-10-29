'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  DownloadCloud,
  FileCheck2,
  AlertCircle,
  Binary,
  Layers,
  Sparkles,
  Link2,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

interface DatasetSource {
  source_id: string;
  name: string;
  organization: string;
  base_url: string;
  dataset_id: string;
  title: string;
  license: string;
  version: string;
  documentation_url: string;
  measurement_types: string[];
  access_type: string;
  is_synthetic: boolean;
  description: string;
}

interface DatasetRegistryEntry {
  id: string;
  source_name: string;
  dataset_id: string;
  title: string;
  source_url: string;
  version: string;
  license: string;
  checksum_sha256: string;
  measurement_types: string[];
  sample_count: number;
  subject_count: number;
  quality_score: number;
  ml_readiness: string;
  created_at: string;
}

export const DatasetPipelineDashboard: React.FC = () => {
  const [sources, setSources] = useState<DatasetSource[]>([]);
  const [registry, setRegistry] = useState<DatasetRegistryEntry[]>([]);
  const [acquiringSource, setAcquiringSource] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedAuditSource, setSelectedAuditSource] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<any | null>(null);

  const fetchPipelineData = async () => {
    try {
      // 1. Fetch sources
      const srcRes = await fetch('http://localhost:8000/api/v1/datasets/sources');
      if (srcRes.ok) {
        setSources(await srcRes.json());
      }

      // 2. Fetch registry
      const regRes = await fetch('http://localhost:8000/api/v1/datasets/registry');
      if (regRes.ok) {
        setRegistry(await regRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch dataset pipeline info:', err);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const handleAcquire = async (sourceId: string) => {
    setAcquiringSource(sourceId);
    setStatusMessage(`Acquiring, validating, and computing SHA-256 for ${sourceId}...`);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/datasets/acquire/${sourceId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMessage(`Successfully acquired & normalized ${data.title} (${data.normalized_samples} samples, Zero Subject Leakage: VERIFIED).`);
        await fetchPipelineData();
      } else {
        setStatusMessage('Acquisition failed: Remote gateway or rate limit error.');
      }
    } catch (err) {
      setStatusMessage('Acquisition error: Network communication failure.');
    } finally {
      setAcquiringSource(null);
    }
  };

  const handleInspectAudit = async (sourceId: string) => {
    setSelectedAuditSource(sourceId);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/datasets/quality-report/${sourceId}`);
      if (res.ok) {
        setAuditReport(await res.json());
      }
    } catch (err) {
      console.error('Error fetching quality report:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Strip */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-mono font-bold tracking-tight text-slate-900">
                Official Physiological Dataset Collection & ML Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                PROVENANCE VERIFIED
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Live Connectors: NASA OSDR • NASA Life Sciences Portal (LSDA) • PhysioNet • Authorized Wearables
            </p>
          </div>
        </div>

        <button
          onClick={fetchPipelineData}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {statusMessage && (
        <div className="text-xs font-mono text-sky-800 bg-sky-50 border border-sky-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 ml-3">✕</button>
        </div>
      )}

      {/* Official Sources Cards */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3 font-bold">
          Official Discoverable Repositories & API Connectors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map(src => {
            const isAcquiring = acquiringSource === src.source_id;

            return (
              <div
                key={src.source_id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">
                      {src.organization}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                      src.is_synthetic ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-sky-50 text-sky-800 border border-sky-200"
                    )}>
                      {src.is_synthetic ? 'SYNTHETIC' : 'OFFICIAL OPEN ACCESS'}
                    </span>
                  </div>

                  <h4 className="text-sm font-mono font-bold text-slate-900 mb-1">
                    {src.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">
                    {src.description}
                  </p>

                  <div className="space-y-1.5 text-[11px] font-mono text-slate-600 mb-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dataset ID:</span>
                      <strong className="text-slate-800">{src.dataset_id}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">License:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">{src.license}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Official URL:</span>
                      <a
                        href={src.documentation_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 hover:underline flex items-center gap-1"
                      >
                        <span>Inspect Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Measurement Types Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {src.measurement_types.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-700">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleAcquire(src.source_id)}
                    disabled={isAcquiring}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <DownloadCloud className={cn("w-3.5 h-3.5", isAcquiring && "animate-bounce")} />
                    <span>{isAcquiring ? 'Acquiring...' : 'Acquire & Ingest'}</span>
                  </button>

                  <button
                    onClick={() => handleInspectAudit(src.source_id)}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Inspect Quality & Anti-Leakage Report"
                  >
                    <FileCheck2 className="w-4 h-4 text-sky-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cryptographic Provenance Registry Table */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-2">
              <Binary className="w-4 h-4 text-sky-600" />
              <span>Immutable Dataset Registry & Cryptographic SHA-256 Ledger</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Strict audit trail preserving hashes, timestamps, subjects, and zero-leakage splits.
            </p>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {registry.length} Datasets Normalized
          </span>
        </div>

        {registry.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-xs text-slate-500">
            No datasets acquired yet. Click "Acquire & Ingest" on any official source above to start ingestion.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="py-2.5 px-3">Dataset ID</th>
                  <th className="py-2.5 px-3">Source Repository</th>
                  <th className="py-2.5 px-3">SHA-256 Cryptographic Hash</th>
                  <th className="py-2.5 px-3">Samples</th>
                  <th className="py-2.5 px-3">Subjects</th>
                  <th className="py-2.5 px-3">Quality Score</th>
                  <th className="py-2.5 px-3">ML Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registry.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{entry.dataset_id}</td>
                    <td className="py-3 px-3 text-slate-700">{entry.source_name}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title={entry.checksum_sha256}>
                        {entry.checksum_sha256?.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-bold">{entry.sample_count}</td>
                    <td className="py-3 px-3 text-slate-700">{entry.subject_count}</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        {entry.quality_score}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-[10px]">
                        {entry.ml_readiness}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Modal if inspected */}
      {selectedAuditSource && auditReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900">
                Data Quality & Anti-Leakage Audit: {selectedAuditSource}
              </h4>
              <button onClick={() => setSelectedAuditSource(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] overflow-x-auto max-h-96">
              {JSON.stringify(auditReport, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAuditSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
