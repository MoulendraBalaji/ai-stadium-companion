import React, { useState, useEffect } from 'react';
import { api, CrowdZoneStatus, OpsSummaryResponse } from '../lib/api';
import { ShieldAlert, RefreshCw, Layers, CheckCircle2, TrendingUp, Users, Clock, Activity } from 'lucide-react';

export const OpsDashboard: React.FC = () => {
  const [zones, setZones] = useState<CrowdZoneStatus[]>([]);
  const [opsData, setOpsData] = useState<OpsSummaryResponse | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const [repRole, setRepRole] = useState('Volunteer');
  const [incLoc, setIncLoc] = useState('gate_c');
  const [incType, setIncType] = useState('Spill');
  const [incDetails, setIncDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchTelemetry();
    generateAISummary();
  }, []);

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReporting(true);
    setReportSuccess(false);
    setErrorMsg(null);
    try {
      await api.reportIncident(repRole, incLoc, incType, incDetails);
      setReportSuccess(true);
      setIncDetails('');
      await fetchTelemetry();
      await generateAISummary();
      setTimeout(() => setReportSuccess(false), 4000);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setIsReporting(false);
    }
  };

  const fetchTelemetry = async () => {
    setIsLoadingFeed(true);
    try {
      const res = await api.getCrowdStatus();
      setZones(res.zones);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Failed to load live telemetry.');
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const generateAISummary = async () => {
    setIsLoadingSummary(true);
    setErrorMsg(null);
    try {
      const res = await api.getOpsSummary();
      setOpsData(res);
      setCompletedActions({});
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Failed to generate AI report.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical': return <span className="badge badge-danger">{status}</span>;
      case 'Crowded': return <span className="badge badge-warn">{status}</span>;
      default: return <span className="badge badge-success">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow-sm">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-text-strong)' }}>
            Command Center
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Live stadium telemetry & AI tactical recommendations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Match Attendance', value: '68,420', sub: '94.6% capacity', icon: Users, color: 'accent' },
          { label: 'Peak Gate Wait', value: '25', unit: 'min', sub: 'Gate C — East', icon: Clock, color: 'danger' },
          { label: 'Active Staff', value: '320', sub: '85 volunteers deployed', icon: ShieldAlert, color: 'accent' },
        ].map((stat, i) => (
          <div key={i} className="card p-5 group" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="stat-label text-[10px]">{stat.label}</div>
                <div className="stat-value mt-2">
                  {stat.value}{stat.unit && <span className="text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>{stat.unit}</span>}
                </div>
                <div className="text-xs mt-2 flex items-center gap-1.5" style={{ color: stat.color === 'danger' ? '#f87171' : 'var(--color-accent)' }}>
                  {stat.color === 'danger' ? <Clock size={12} /> : <TrendingUp size={12} />}
                  {stat.sub}
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{
                background: stat.color === 'danger' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                border: `1px solid ${stat.color === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}`,
              }}>
                <stat.icon size={20} style={{ color: stat.color === 'danger' ? '#f87171' : 'var(--color-accent)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          <div className="card p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Layers size={15} className="text-accent" />
                </div>
                <h2 className="text-sm font-bold font-display uppercase tracking-wider" style={{ color: 'var(--color-text-strong)' }}>
                  Live Telemetry
                </h2>
              </div>
              <button
                onClick={fetchTelemetry}
                disabled={isLoadingFeed}
                className="p-2 rounded-xl transition-all duration-300 hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)' }}
                title="Refresh feed"
              >
                <RefreshCw size={13} className={isLoadingFeed ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="mt-4 space-y-3 flex-1">
              {zones.length === 0 && isLoadingFeed && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[72px] rounded-xl shimmer" />
                  ))}
                </div>
              )}
              {zones.map((zone, idx) => (
                <div
                  key={zone.zone_id}
                  className="p-4 rounded-xl flex items-center justify-between animate-fade-in-up"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    animationDelay: `${idx * 60}ms`
                  }}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm font-display" style={{ color: 'var(--color-text-strong)' }}>{zone.zone_name}</div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {zone.zone_id} · Score: {zone.density_score}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="stat-label text-[9px]">Wait</div>
                      <div className="font-bold font-mono text-sm" style={{ color: 'var(--color-text-strong)' }}>
                        {zone.queue_time_minutes}m
                      </div>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <div className="stat-label text-[9px]">Density</div>
                      <div className="mt-0.5">{getStatusBadge(zone.status)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[10px] italic pt-3" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)' }}>
              Simulated live IoT sensor telemetry.
            </div>
          </div>

          <div className="card p-5 flex flex-col">
            <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert size={15} className="text-red-400" />
              </div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider" style={{ color: 'var(--color-text-strong)' }}>
                Incident Report
              </h2>
            </div>

            <form onSubmit={handleIncidentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Role</label>
                  <select value={repRole} onChange={(e) => setRepRole(e.target.value)} className="input-field text-xs">
                    <option value="Volunteer">Volunteer</option>
                    <option value="Organizer">Organizer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Location</label>
                  <select value={incLoc} onChange={(e) => setIncLoc(e.target.value)} className="input-field text-xs">
                    <option value="gate_c">Gate C — East</option>
                    <option value="gate_a">Gate A — North</option>
                    <option value="gate_b">Gate B — South</option>
                    <option value="sec_114">Section 114</option>
                    <option value="sec_112">Section 112</option>
                    <option value="concessions_east">Concessions East</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Incident Type</label>
                <select value={incType} onChange={(e) => setIncType(e.target.value)} className="input-field text-xs">
                  <option value="Spill">Spill / Slip Hazard</option>
                  <option value="Crowd Surge">Crowd Surge / Bottleneck</option>
                  <option value="Medical">Medical Assistance</option>
                  <option value="Security Alert">Security Incident</option>
                  <option value="Gate Equipment Failure">Turnstile Malfunction</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Description</label>
                <textarea
                  value={incDetails}
                  onChange={(e) => setIncDetails(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue..."
                  className="input-field text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isReporting || !incDetails.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98] text-white text-xs disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                }}
              >
                {isReporting ? 'Logging...' : 'Submit Report'}
              </button>
              {reportSuccess && (
                <p className="text-[10px] text-center font-medium" style={{ color: '#34d399' }}>
                  Report logged successfully. Updating AI analysis...
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
                <ShieldAlert size={15} className="text-accent" />
              </div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider" style={{ color: 'var(--color-text-strong)' }}>
                AI Intelligence
              </h2>
            </div>
            <button
              onClick={generateAISummary}
              disabled={isLoadingSummary}
              className="p-2 rounded-xl transition-all duration-300 hover:bg-white/5"
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)' }}
              title="Regenerate Report"
            >
              <RefreshCw size={13} className={isLoadingSummary ? 'animate-spin' : ''} />
            </button>
          </div>

          {isLoadingSummary && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              <div className="text-xs font-tech" style={{ color: 'var(--color-accent)' }}>Analyzing crowd sensors...</div>
              <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-cyan animate-shimmer" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {!isLoadingSummary && opsData && (
            <div className="mt-4 space-y-5 flex-1 animate-fade-in-up">
              <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-mono" style={{ color: 'var(--color-accent)' }}>
                  <Activity size={12} /> Summary
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {opsData.summary}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono" style={{ color: 'var(--color-accent)' }}>
                  <CheckCircle2 size={12} /> Recommended Actions
                </div>
                {opsData.recommended_actions.map((action, idx) => {
                  const done = !!completedActions[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleAction(idx);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={done}
                      className="p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-start gap-3 select-none animate-fade-in-up"
                      style={{
                        background: 'var(--color-surface)',
                        border: `1px solid ${done ? 'var(--color-border-subtle)' : 'var(--color-border-subtle)'}`,
                        opacity: done ? 0.5 : 1,
                        animationDelay: `${idx * 80}ms`
                      }}
                    >
                      <div className="mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0" style={{
                        background: done ? 'var(--color-accent)' : 'transparent',
                        border: `1.5px solid ${done ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        color: done ? 'white' : 'transparent'
                      }}>
                        {done && <CheckCircle2 size={13} />}
                      </div>
                      <span className="text-sm leading-relaxed" style={{
                        color: done ? 'var(--color-text-muted)' : 'var(--color-text-strong)',
                        textDecoration: done ? 'line-through' : 'none'
                      }}>
                        {action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {errorMsg && !isLoadingSummary && (
            <div className="mt-4 p-4 rounded-xl text-xs flex gap-3 animate-fade-in-up" style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#f87171'
            }}>
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {opsData && (
            <div className="mt-4 text-[10px] font-mono pt-3 text-right" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)' }}>
              Generated: {new Date(opsData.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
