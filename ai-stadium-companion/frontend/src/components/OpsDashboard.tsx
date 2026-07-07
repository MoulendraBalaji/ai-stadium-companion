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

  useEffect(() => {
    fetchTelemetry();
    generateAISummary();
  }, []);

  const fetchTelemetry = async () => {
    setIsLoadingFeed(true);
    try {
      const res = await api.getCrowdStatus();
      setZones(res.zones);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load live telemetry feed.');
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
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to generate AI operational report.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Crowded':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 font-sans text-sm text-ink pb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-lg shadow-primary/10">
          <Activity size={18} className="text-canvas" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-tech uppercase tracking-wider text-ink-strong">Operations Dashboard</h2>
          <p className="text-xs text-mute font-sans">Live stadium telemetry & AI recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-canvas-soft to-canvas border-1 border-hairline p-5 rounded-xl card-hover">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-mute uppercase font-semibold font-display tracking-wider">Match Attendance</div>
              <div className="text-3xl font-bold font-mono text-ink-strong mt-1">68,420</div>
              <div className="text-[11px] text-primary flex items-center gap-1 mt-1.5 font-sans">
                <TrendingUp size={12} /> 94.6% capacity
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border-1 border-primary/20 text-primary">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-canvas-soft to-canvas border-1 border-hairline p-5 rounded-xl card-hover">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-mute uppercase font-semibold font-display tracking-wider">Peak Gate Wait</div>
              <div className="text-3xl font-bold font-mono text-ink-strong mt-1">25<span className="text-lg text-mute">min</span></div>
              <div className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-sans">
                <Clock size={12} /> Gate C - East Entrance
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border-1 border-red-500/20 text-red-400">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-canvas-soft to-canvas border-1 border-hairline p-5 rounded-xl card-hover">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-mute uppercase font-semibold font-display tracking-wider">Active Staff</div>
              <div className="text-3xl font-bold font-mono text-ink-strong mt-1">320</div>
              <div className="text-[11px] text-primary mt-1.5 flex items-center gap-1 font-sans">
                <Users size={12} /> 85 volunteers on route
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border-1 border-primary/20 text-primary">
              <ShieldAlert size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-canvas-soft border-1 border-hairline rounded-xl p-5 flex flex-col shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-hairline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border-1 border-primary/20 flex items-center justify-center">
                <Layers size={15} className="text-primary" />
              </div>
              <h2 className="text-sm font-bold font-tech uppercase tracking-wider text-ink-strong">Live Telemetry</h2>
            </div>
            <button
              onClick={fetchTelemetry}
              disabled={isLoadingFeed}
              className="p-2 rounded-lg border-1 border-hairline text-mute hover:text-primary hover:border-primary/30 transition-all duration-300 bg-canvas hover:bg-canvas-elevated active:scale-95"
              aria-label="Refresh sensor feed"
              title="Refresh feed"
            >
              <RefreshCw size={13} className={isLoadingFeed ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1">
            {zones.length === 0 && isLoadingFeed && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[72px] rounded-lg shimmer-loading" />
                ))}
              </div>
            )}
            {zones.map((zone, idx) => (
              <div
                key={zone.zone_id}
                className="p-4 bg-canvas border-1 border-hairline rounded-lg flex items-center justify-between card-hover animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="space-y-1">
                  <div className="font-bold text-ink-strong font-display">{zone.zone_name}</div>
                  <div className="text-[10px] text-mute font-mono">ID: {zone.zone_id} &middot; Score: {zone.density_score}</div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div className="text-[10px] text-mute font-sans uppercase tracking-wider">Wait</div>
                    <div className="font-bold font-mono text-ink-strong">{zone.queue_time_minutes}m</div>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className="text-[10px] text-mute font-sans uppercase tracking-wider">Density</div>
                    <span className={`text-[11px] font-bold font-mono py-1 px-2.5 rounded-full inline-block mt-0.5 border-1 ${getStatusStyle(zone.status)}`}>
                      {zone.occupancy_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-mute italic font-sans border-t border-hairline pt-3">
            Values are simulated live IoT sensor telemetry.
          </div>
        </div>

        <div className="bg-canvas-soft border-1 border-hairline rounded-xl p-5 flex flex-col shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-hairline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border-1 border-primary/20 flex items-center justify-center">
                <ShieldAlert size={15} className="text-primary" />
              </div>
              <h2 className="text-sm font-bold font-tech uppercase tracking-wider text-ink-strong">AI Intelligence</h2>
            </div>
            <button
              onClick={generateAISummary}
              disabled={isLoadingSummary}
              className="p-2 rounded-lg border-1 border-hairline text-mute hover:text-primary hover:border-primary/30 transition-all duration-300 bg-canvas hover:bg-canvas-elevated active:scale-95"
              aria-label="Regenerate AI analysis report"
              title="Regenerate Report"
            >
              <RefreshCw size={13} className={isLoadingSummary ? 'animate-spin' : ''} />
            </button>
          </div>

          {isLoadingSummary && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 text-mute">
              <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <div className="text-xs font-tech text-primary">Analyzing crowd sensors...</div>
              <div className="w-48 h-1.5 rounded-full bg-hairline overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-deep animate-shimmer" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {!isLoadingSummary && opsData && (
            <div className="mt-4 space-y-4 flex-1 animate-fade-in-up">
              <div className="p-4 bg-canvas border-1 border-hairline rounded-lg">
                <div className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity size={12} /> Summary
                </div>
                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">{opsData.summary}</p>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                      className={`p-3.5 rounded-lg border-1 cursor-pointer transition-all duration-300 flex items-start gap-3 select-none animate-fade-in-up ${
                        done
                          ? 'bg-canvas border-hairline/50 opacity-60'
                          : 'bg-canvas border-hairline hover:border-primary/30 hover:bg-canvas-elevated'
                      }`}
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-1 flex items-center justify-center transition-all duration-300 shrink-0 ${
                        done ? 'bg-primary border-primary text-canvas' : 'border-hairline'
                      }`}>
                        {done && <CheckCircle2 size={13} />}
                      </div>
                      <span className={`text-xs font-sans leading-relaxed ${done ? 'line-through text-mute' : 'text-ink-strong'}`}>{action}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {errorMsg && !isLoadingSummary && (
            <div className="mt-4 p-3.5 bg-red-950/20 border-1 border-red-500/20 text-red-400 rounded-lg text-xs flex gap-2.5 animate-fade-in-up">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {opsData && (
            <div className="mt-4 text-[10px] text-mute font-mono border-t border-hairline pt-3 text-right">
              Generated: {new Date(opsData.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
