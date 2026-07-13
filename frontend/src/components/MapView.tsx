import React, { useState, useEffect } from 'react';
import { api, RouteResponse } from '../lib/api';
import { Navigation, Accessibility, AlertTriangle, RefreshCw, Locate, MapPin } from 'lucide-react';

interface MapViewProps {
  lastRouteIntent: string | null;
}

const coordinates: Record<string, { x: number; y: number }> = {
  gate_a: { x: 250, y: 50 },
  gate_b: { x: 250, y: 450 },
  gate_c: { x: 450, y: 250 },
  gate_d: { x: 50, y: 250 },
  section_101: { x: 250, y: 130 },
  section_114: { x: 250, y: 370 },
  section_120: { x: 370, y: 250 },
  restroom_north_1: { x: 170, y: 180 },
  restroom_north_2: { x: 330, y: 180 },
  restroom_south_1: { x: 250, y: 410 },
  food_concession_1: { x: 420, y: 180 },
  food_concession_2: { x: 80, y: 180 },
  elevator_1: { x: 310, y: 130 },
  stairs_1: { x: 190, y: 130 }
};

const nodeLabels: Record<string, string> = {
  gate_a: 'Gate A (North)',
  gate_b: 'Gate B (South)',
  gate_c: 'Gate C (East)',
  gate_d: 'Gate D (West)',
  section_101: 'Section 101',
  section_114: 'Section 114',
  section_120: 'Section 120',
  restroom_north_1: 'North WC (Standard)',
  restroom_north_2: 'North WC (Accessible)',
  restroom_south_1: 'South WC (Accessible)',
  food_concession_1: 'Tacos Stand',
  food_concession_2: 'Burgers Stand',
  elevator_1: 'North Elevator',
  stairs_1: 'North Stairs'
};

const nodeAccessibility: Record<string, boolean> = {
  gate_a: true, gate_b: true, gate_c: true, gate_d: false,
  section_101: true, section_114: true, section_120: true,
  restroom_north_1: false, restroom_north_2: true, restroom_south_1: true,
  food_concession_1: true, food_concession_2: true,
  elevator_1: true, stairs_1: false
};

const congestionScores: Record<string, number> = {
  gate_a: 0.30, gate_b: 0.40, gate_c: 0.95, gate_d: 0.65,
  section_101: 0.35, section_114: 0.50, section_120: 0.90,
  restroom_north_1: 0.20, restroom_north_2: 0.15, restroom_south_1: 0.70,
  food_concession_1: 0.85, food_concession_2: 0.40,
  elevator_1: 0.10, stairs_1: 0.10
};

export const MapView: React.FC<MapViewProps> = ({ lastRouteIntent }) => {
  const [startNode, setStartNode] = useState('gate_a');
  const [destinationIntent, setDestinationIntent] = useState('');
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animatingRoute, setAnimatingRoute] = useState(false);

  useEffect(() => {
    if (lastRouteIntent) {
      setDestinationIntent(lastRouteIntent);
      calculateRoute(startNode, lastRouteIntent, accessibleOnly);
    }
  }, [lastRouteIntent]);

  const calculateRoute = async (start: string, intent: string, accOnly: boolean) => {
    if (!intent.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setAnimatingRoute(false);
    try {
      const res = await api.getRoute(start, intent, accOnly);
      setRouteData(res);
      setTimeout(() => setAnimatingRoute(true), 100);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to calculate path.');
      setRouteData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateRoute(startNode, destinationIntent, accessibleOnly);
  };

  const toggleAccessibleMode = () => {
    const nextAcc = !accessibleOnly;
    setAccessibleOnly(nextAcc);
    if (destinationIntent) {
      calculateRoute(startNode, destinationIntent, nextAcc);
    }
  };

  const selectNode = (nodeId: string) => {
    setStartNode(nodeId);
    if (destinationIntent) {
      calculateRoute(nodeId, destinationIntent, accessibleOnly);
    }
  };

  const getNodeColor = (congestion: number) => {
    if (congestion > 0.75) return '#ef4444';
    if (congestion > 0.4) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full" style={{ minHeight: 'calc(100vh - 7rem)' }}>
      <div className="lg:col-span-1 card p-5 flex flex-col overflow-hidden">
        <form onSubmit={handleRouteSubmit} className="space-y-5">
          <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Navigation size={16} className="text-accent" />
            </div>
            <h2 className="text-sm font-bold font-display uppercase tracking-wider" style={{ color: 'var(--color-text-strong)' }}>
              Wayfinding
            </h2>
          </div>

          <div className="space-y-2">
            <label htmlFor="start-node" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={12} /> Start Location
            </label>
            <select
              id="start-node"
              value={startNode}
              onChange={(e) => {
                setStartNode(e.target.value);
                if (destinationIntent) {
                  calculateRoute(e.target.value, destinationIntent, accessibleOnly);
                }
              }}
              className="input-field text-sm"
            >
              {Object.keys(coordinates).map((nid) => (
                <option key={nid} value={nid}>{nodeLabels[nid]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="dest-intent" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              <Locate size={12} /> Destination
            </label>
            <input
              id="dest-intent"
              type="text"
              value={destinationIntent}
              onChange={(e) => setDestinationIntent(e.target.value)}
              placeholder="e.g., nearest accessible restroom"
              className="input-field text-sm"
            />
          </div>

          <button
            type="button"
            onClick={toggleAccessibleMode}
            className="w-full flex items-center justify-between p-3.5 rounded-xl cursor-pointer select-none transition-all duration-300"
            style={{
              background: 'var(--color-surface)',
              border: `1px solid ${accessibleOnly ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <Accessibility size={16} style={{ color: accessibleOnly ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
              <span className="text-xs font-semibold font-display" style={{ color: 'var(--color-text)' }}>Accessible Routes</span>
            </div>
            <div className="relative">
              <div
                className="w-10 h-5 rounded-full p-0.5 transition-colors duration-300"
                style={{ background: accessibleOnly ? 'var(--color-accent)' : 'var(--color-border)' }}
              >
                <div
                  className="bg-white w-4 h-4 rounded-full shadow-md transform duration-300"
                  style={{ transform: accessibleOnly ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </div>
            </div>
          </button>

          <button
            type="submit"
            disabled={isLoading || !destinationIntent.trim()}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <>
                <Navigation size={16} />
                Calculate Route
              </>
            )}
          </button>
        </form>

        <div className="flex-1 mt-5 overflow-y-auto space-y-4 max-h-[300px] lg:max-h-none pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          {errorMessage && (
            <div className="p-4 rounded-xl text-xs flex gap-3 animate-fade-in-up" style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#f87171'
            }}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {routeData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="stat-label text-[10px] mb-1">Distance</div>
                  <div className="stat-value text-lg">{routeData.total_distance_meters}m</div>
                </div>
                <div className="p-3.5 rounded-xl text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="stat-label text-[10px] mb-1">Est. Time</div>
                  <div className="stat-value text-lg">{Math.ceil(routeData.total_estimated_seconds / 60)}min</div>
                </div>
              </div>

              {routeData.congestion_level === 'High' && (
                <div className="p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in-up" style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#f87171'
                }}>
                  <AlertTriangle size={14} />
                  <span>High congestion detected. Dynamic rerouting applied.</span>
                </div>
              )}

              <h3 className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text-muted)' }}>
                Directions
              </h3>
              <ol className="space-y-3">
                {routeData.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 items-start animate-fade-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="flex flex-col items-center">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono shrink-0" style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        color: 'var(--color-accent-light)'
                      }}>
                        {idx + 1}
                      </span>
                      {idx < routeData.steps.length - 1 && (
                        <div className="w-px flex-1 min-h-[16px] mt-1" style={{ background: 'var(--color-border-subtle)' }} />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>{step.instruction}</p>
                      <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {step.distance_meters}m · ~{Math.round(step.estimated_seconds)}s
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!routeData && !errorMessage && !isLoading && (
            <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs">Enter a destination to generate routing steps.</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 card p-5 flex flex-col items-center relative min-h-[500px] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl overflow-hidden" style={{
            background: 'var(--color-surface-overlay)',
            backdropFilter: 'blur(8px)'
          }}>
            <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent animate-scan opacity-60" />
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              <span className="text-xs uppercase tracking-widest font-tech font-bold" style={{ color: 'var(--color-accent)' }}>
                Calculating Path
              </span>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2 text-xs">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success shadow-sm" />
              <span style={{ color: 'var(--color-text-secondary)' }}>Normal</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warn" />
              <span style={{ color: 'var(--color-text-secondary)' }}>Moderate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping-slow" />
              <span style={{ color: 'var(--color-text-secondary)' }}>Congested</span>
            </span>
          </div>
          <span className="italic text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Tap a node to set start point</span>
        </div>

        <div className="flex-1 w-full flex items-center justify-center">
          <svg
            viewBox="0 0 500 500"
            className="w-full max-w-[460px] aspect-square"
            aria-label="Stadium interactive routing map"
            role="application"
          >
            <defs>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlowRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowStrong">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <ellipse cx="250" cy="250" rx="220" ry="210" fill="none" stroke="rgba(59,130,246,0.06)" strokeWidth="6" />
            <ellipse cx="250" cy="250" rx="160" ry="140" fill="none" stroke="rgba(59,130,246,0.03)" strokeWidth="1.5" strokeDasharray="4,6" />

            <g stroke="rgba(59,130,246,0.08)" strokeWidth="2">
              <line x1="250" y1="50" x2="250" y2="130" />
              <line x1="250" y1="450" x2="250" y2="370" />
              <line x1="450" y1="250" x2="370" y2="250" />
              <line x1="50" y1="250" x2="80" y2="180" />
              <line x1="80" y1="180" x2="250" y2="370" strokeDasharray="3,4" />
              <line x1="250" y1="130" x2="370" y2="250" />
              <line x1="370" y1="250" x2="250" y2="370" />
              <line x1="250" y1="130" x2="190" y2="130" />
              <line x1="250" y1="130" x2="310" y2="130" />
              <line x1="190" y1="130" x2="170" y2="180" />
              <line x1="310" y1="130" x2="330" y2="180" />
              <line x1="330" y1="180" x2="170" y2="180" strokeDasharray="3,4" />
              <line x1="370" y1="250" x2="420" y2="180" />
              <line x1="250" y1="370" x2="250" y2="410" />
            </g>

            {routeData && routeData.path && routeData.path.length > 1 && (
              <g>
                <g stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.12" filter="url(#glowStrong)">
                  {routeData.path.map((nodeId, i) => {
                    if (i >= routeData.path.length - 1) return null;
                    const uC = coordinates[routeData.path[i]];
                    const vC = coordinates[routeData.path[i + 1]];
                    if (!uC || !vC) return null;
                    return <line key={`bg-${i}`} x1={uC.x} y1={uC.y} x2={vC.x} y2={vC.y} />;
                  })}
                </g>
                <g stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)">
                  {routeData.path.map((nodeId, i) => {
                    if (i >= routeData.path.length - 1) return null;
                    const uC = coordinates[routeData.path[i]];
                    const vC = coordinates[routeData.path[i + 1]];
                    if (!uC || !vC) return null;
                    return (
                      <line
                        key={`route-${i}`}
                        x1={uC.x} y1={uC.y} x2={vC.x} y2={vC.y}
                        strokeDasharray={animatingRoute ? '8 4' : 'none'}
                        className={animatingRoute ? 'animate-route-dash' : ''}
                      />
                    );
                  })}
                </g>
              </g>
            )}

            {Object.entries(coordinates).map(([nodeId, coord]) => {
              const label = nodeLabels[nodeId];
              const isStart = startNode === nodeId;
              const isDest = routeData?.destination_node_id === nodeId;
              const isAccessible = nodeAccessibility[nodeId];
              const congestion = congestionScores[nodeId] || 0.0;
              const nodeColor = getNodeColor(congestion);
              const isHovered = hoveredNode === nodeId;

              return (
                <g
                  key={nodeId}
                  className="cursor-pointer outline-none"
                  role="button"
                  onClick={() => selectNode(nodeId)}
                  onMouseEnter={() => setHoveredNode(nodeId)}
                  onMouseLeave={() => setHoveredNode(null)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectNode(nodeId);
                    }
                  }}
                  aria-label={`${label}, Congestion: ${Math.round(congestion * 100)}%, ${isAccessible ? 'wheelchair accessible' : 'stairs only'}`}
                >
                  {(congestion > 0.75 || isHovered || isStart || isDest) && (
                    <circle
                      cx={coord.x} cy={coord.y}
                      r={isStart || isDest ? 18 : 14}
                      fill={congestion > 0.75 ? 'url(#nodeGlowRed)' : 'url(#nodeGlow)'}
                      className={congestion > 0.75 ? 'animate-ping-slow' : ''}
                    />
                  )}

                  {isStart && (
                    <text x={coord.x} y={coord.y - 18} textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="bold" fontFamily="Space Grotesk, sans-serif">
                      START
                    </text>
                  )}
                  {isDest && (
                    <text x={coord.x} y={coord.y - 18} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="Space Grotesk, sans-serif">
                      DEST
                    </text>
                  )}

                  <circle
                    cx={coord.x} cy={coord.y}
                    r={isStart || isDest ? 9 : 7}
                    fill={isStart ? '#3b82f6' : isDest ? '#10b981' : nodeColor}
                    stroke="var(--color-bg)"
                    strokeWidth="2.5"
                    filter={isHovered ? 'url(#glow)' : undefined}
                    className="transition-all duration-300"
                  />

                  <circle
                    cx={coord.x} cy={coord.y}
                    r={isStart || isDest ? 13 : 10}
                    fill="none"
                    stroke={isStart ? '#3b82f6' : isDest ? '#10b981' : nodeColor}
                    strokeWidth="1"
                    opacity={isHovered ? 0.4 : 0}
                    className="transition-opacity duration-300"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-full p-4 mt-4 rounded-xl min-h-[56px] flex items-center" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)'
        }}>
          {hoveredNode ? (
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="font-bold text-sm font-display" style={{ color: 'var(--color-text-strong)' }}>{nodeLabels[hoveredNode]}</div>
                <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="text-[10px] uppercase font-mono" style={{ color: 'var(--color-accent)' }}>
                    {hoveredNode.split('_')[0]}
                  </span>
                  <span>·</span>
                  <span style={{ color: nodeAccessibility[hoveredNode] ? 'var(--color-accent)' : '#f87171' }}>
                    {nodeAccessibility[hoveredNode] ? 'Wheelchair Accessible' : 'Stairs Only'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="stat-label text-[10px]">Congestion</div>
                <div className="text-base font-bold font-mono" style={{
                  color: congestionScores[hoveredNode] > 0.75 ? '#f87171' :
                    congestionScores[hoveredNode] > 0.4 ? '#fbbf24' : '#34d399'
                }}>
                  {Math.round(congestionScores[hoveredNode] * 100)}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs w-full text-center italic" style={{ color: 'var(--color-text-muted)' }}>
              Hover or tap a node to view occupancy details
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
