'use client';

import React, { useState } from 'react';
import { Upload, Plus, X, FileSpreadsheet, Check } from 'lucide-react';
import { HealthObservation, MeasurementType } from '../types';
import { cn } from '../lib/utils';

interface DataIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddObservation: (obs: HealthObservation) => void;
  onImportCSV: (csvText: string) => void;
}

export const DataIngestModal: React.FC<DataIngestModalProps> = ({
  isOpen,
  onClose,
  onAddObservation,
  onImportCSV
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  
  // Manual Entry Form State
  const [measurement, setMeasurement] = useState<MeasurementType>('heart_rate');
  const [val, setVal] = useState<string>('72');
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [activity, setActivity] = useState<string>('routine_work');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const isBP = measurement === 'blood_pressure';
    const now = new Date().toISOString();

    const newObs: HealthObservation = {
      eventId: crypto.randomUUID(),
      astronautId: '11111111-1111-1111-1111-111111111111',
      measurement,
      value: isBP ? undefined : parseFloat(val),
      systolicValue: isBP ? parseFloat(systolic) : undefined,
      diastolicValue: isBP ? parseFloat(diastolic) : undefined,
      unit: measurement === 'heart_rate' ? 'bpm' : measurement === 'spo2' ? 'percent' : 'mmHg',
      observedAt: now,
      source: 'manual',
      quality: 'valid',
      context: { activity },
      syncStatus: 'pending'
    };

    onAddObservation(newObs);
    setSuccessMsg(`Logged manual ${measurement} reading successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onImportCSV(text);
        setSuccessMsg(`Imported telemetry file: ${file.name}`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-800">
              Telemetry Ingestion & Dataset Replay
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 text-xs font-mono">
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              "flex-1 py-3 text-center border-b-2 transition-colors",
              activeTab === 'manual' ? "border-sky-600 text-sky-700 font-bold bg-sky-50/50" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            Manual Observation
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={cn(
              "flex-1 py-3 text-center border-b-2 transition-colors",
              activeTab === 'csv' ? "border-sky-600 text-sky-700 font-bold bg-sky-50/50" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            CSV Telemetry Replay
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Measurement Indicator
                </label>
                <select
                  value={measurement}
                  onChange={e => setMeasurement(e.target.value as MeasurementType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="spo2">Oxygen Saturation (SpO₂ %)</option>
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                </select>
              </div>

              {measurement === 'blood_pressure' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1">Systolic (mmHg)</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={e => setSystolic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1">Diastolic (mmHg)</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={e => setDiastolic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    Value ({measurement === 'heart_rate' ? 'bpm' : '%'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Mission Activity Context</label>
                <select
                  value={activity}
                  onChange={e => setActivity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="routine_work">Routine Maintenance / Duty</option>
                  <option value="rest">Monitored Rest Cycle</option>
                  <option value="exercise">High-Intensity Treadmill/ARED</option>
                  <option value="eva">Extravehicular Activity (EVA)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-mono text-white font-bold transition-all shadow-sm"
                >
                  Log Observation
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-8 transition-colors cursor-pointer relative bg-slate-50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-10 h-10 text-sky-600 mx-auto mb-3 opacity-80" />
                <p className="text-xs font-mono text-slate-800 font-bold mb-1">
                  Drop Telemetry CSV file here or click to browse
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Accepts generated datasets from scripts/scenarios/*.csv
                </p>
              </div>

              <div className="text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                <span className="text-slate-800 font-bold block mb-1">Available Scenario CSVs:</span>
                <div>• scripts/scenarios/baseline_telemetry.csv</div>
                <div>• scripts/scenarios/hypoxia_fatigue_telemetry.csv</div>
                <div>• scripts/scenarios/sensor_fault_telemetry.csv</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
