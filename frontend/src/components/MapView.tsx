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
  food_concession_1: 'Tacos (Food)',
  food_concession_2: 'Burgers (Food)',
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
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
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
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to calculate path.');
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
    if (congestion > 0.4) return '#eab308';
    return '#00d992';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full font-sans text-sm text-ink overflow-hidden">
      <div className="lg:col-span-1 bg-canvas-soft border-1 border-hairline rounded-xl p-5 flex flex-col justify-between overflow-y-auto">
        <form onSubmit={handleRouteSubmit} className="space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border-1 border-primary/20 flex items-center justify-center">
              <Navigation size={16} className="text-primary" />
            </div>
            <h2 className="text-sm font-bold font-tech uppercase tracking-wider text-ink-strong">Wayfinding</h2>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="start-node" className="text-xs text-mute uppercase font-semibold font-display tracking-wider flex items-center gap-1.5">
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
              className="w-full bg-canvas text-ink border-1 border-hairline rounded-lg py-2.5 px-3.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-300 font-sans text-sm"
            >
              {Object.keys(coordinates).map((nid) => (
                <option key={nid} value={nid}>{nodeLabels[nid]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dest-intent" className="text-xs text-mute uppercase font-semibold font-display tracking-wider flex items-center gap-1.5">
              <Locate size={12} /> Destination
            </label>
            <input
              id="dest-intent"
              type="text"
              value={destinationIntent}
              onChange={(e) => setDestinationIntent(e.target.value)}
              placeholder="e.g., nearest accessible restroom"
              className="w-full bg-canvas text-ink border-1 border-hairline rounded-lg py-2.5 px-3.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-mute font-sans text-sm transition-all duration-300"
            />
          </div>

          <label className="flex items-center justify-between p-3 bg-canvas rounded-lg border-1 border-hairline cursor-pointer select-none group">
            <div className="flex items-center gap-2.5 font-display">
              <Accessibility size={16} className={accessibleOnly ? 'text-primary' : 'text-mute'} />
              <span className="text-xs font-semibold">Accessible pathing</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={accessibleOnly}
                onChange={toggleAccessibleMode}
                className="sr-only"
                id="accessible-toggle"
                aria-label="Step-free accessible pathing toggle"
              />
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${
                  accessibleOnly ? 'bg-primary' : 'bg-hairline group-hover:bg-hairline/80'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                    accessibleOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </label>

          <button
            type="submit"
            disabled={isLoading || !destinationIntent.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-deep text-canvas rounded-lg font-semibold font-display hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-[0.98]"
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

        <div className="flex-1 mt-6 overflow-y-auto space-y-4 max-h-[280px] lg:max-h-none border-t border-hairline pt-4 pr-1">
          {errorMessage && (
            <div className="p-3.5 bg-red-950/20 border-1 border-red-500/20 text-red-400 rounded-lg text-xs flex gap-2.5 animate-fade-in-up">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {routeData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-canvas p-3 rounded-lg border-1 border-hairline text-center">
                  <div className="text-[10px] text-mute uppercase tracking-wider font-semibold">Distance</div>
                  <div className="text-lg font-bold font-mono text-ink-strong mt-1">{routeData.total_distance_meters}m</div>
                </div>
                <div className="bg-canvas p-3 rounded-lg border-1 border-hairline text-center">
                  <div className="text-[10px] text-mute uppercase tracking-wider font-semibold">Est. Time</div>
                  <div className="text-lg font-bold font-mono text-ink-strong mt-1">{Math.ceil(routeData.total_estimated_seconds / 60)}min</div>
                </div>
              </div>

              {routeData.congestion_level === 'High' && (
                <div className="p-3 bg-red-950/20 border-1 border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2 animate-fade-in-up">
                  <AlertTriangle size={14} />
                  <span>High path congestion. Dynamic rerouting was applied.</span>
                </div>
              )}

              <h3 className="text-xs font-bold uppercase text-mute tracking-wider font-display">Directions</h3>
              <ol className="space-y-2.5 font-sans text-xs">
                {routeData.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 items-start animate-fade-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="flex flex-col items-center">
                      <span className="w-6 h-6 rounded-full bg-primary/10 border-1 border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary font-mono shrink-0">
                        {idx + 1}
                      </span>
                      {idx < routeData.steps.length - 1 && <div className="w-px flex-1 bg-hairline min-h-[20px] mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-ink-strong font-medium">{step.instruction}</p>
                      <p className="text-mute mt-0.5 font-mono text-[10px]">
                        {step.distance_meters}m &middot; ~{Math.round(step.estimated_seconds)}s
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!routeData && !errorMessage && !isLoading && (
            <div className="text-center text-mute py-8 text-xs">
              <MapPin size={24} className="mx-auto mb-3 opacity-30" />
              Enter a destination to generate turn-by-turn routing steps.
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-canvas-soft border-1 border-hairline rounded-xl p-5 flex flex-col items-center relative min-h-[500px] overflow-hidden shadow-lg">
        {isLoading && (
          <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-xl overflow-hidden">
            <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line opacity-60" />
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="text-xs uppercase tracking-widest text-primary font-tech font-bold">Calculating Path...</span>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2 text-xs font-display">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/30" /> Normal</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Moderate</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping-slow" /> Congested</span>
          </div>
          <div className="text-mute italic text-[10px]">Tap a node to set start point</div>
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
                <stop offset="0%" stopColor="#00d992" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00d992" stopOpacity="0" />
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
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <ellipse cx="250" cy="250" rx="220" ry="210" fill="none" stroke="#1a1a1a" strokeWidth="6" />
            <ellipse cx="250" cy="250" rx="160" ry="140" fill="none" stroke="#222" strokeWidth="1.5" strokeDasharray="4,6" />

            <g stroke="#2a2a2a" strokeWidth="2">
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
                <g stroke="#00d992" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.15" filter="url(#glowStrong)">
                  {(() => {
                    const lines = [];
                    for (let i = 0; i < routeData.path.length - 1; i++) {
                      const u = routeData.path[i];
                      const v = routeData.path[i + 1];
                      const uC = coordinates[u];
                      const vC = coordinates[v];
                      if (uC && vC) {
                        lines.push(<line key={i} x1={uC.x} y1={uC.y} x2={vC.x} y2={vC.y} />);
                      }
                    }
                    return lines;
                  })()}
                </g>
                <g stroke="#00d992" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)">
                  {(() => {
                    const lines = [];
                    for (let i = 0; i < routeData.path.length - 1; i++) {
                      const u = routeData.path[i];
                      const v = routeData.path[i + 1];
                      const uC = coordinates[u];
                      const vC = coordinates[v];
                      if (uC && vC) {
                        lines.push(
                          <line
                            key={i}
                            x1={uC.x} y1={uC.y} x2={vC.x} y2={vC.y}
                            strokeDasharray={animatingRoute ? '8 4' : 'none'}
                            className={animatingRoute ? 'animate-route-dash' : ''}
                          />
                        );
                      }
                    }
                    return lines;
                  })()}
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
              const isFocused = focusedNode === nodeId;

              return (
                <g
                  key={nodeId}
                  className="cursor-pointer outline-none"
                  role="button"
                  onClick={() => selectNode(nodeId)}
                  onMouseEnter={() => setFocusedNode(nodeId)}
                  onMouseLeave={() => setFocusedNode(null)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectNode(nodeId);
                    }
                  }}
                  aria-label={`${label}, Congestion: ${Math.round(congestion * 100)}%, ${isAccessible ? 'wheelchair accessible' : 'stairs only'}`}
                >
                  {(congestion > 0.75 || isFocused || isStart || isDest) && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isStart || isDest ? 16 : 14}
                      fill={congestion > 0.75 ? 'url(#nodeGlowRed)' : 'url(#nodeGlow)'}
                      className={congestion > 0.75 ? 'animate-ping-slow' : ''}
                    />
                  )}

                  {isStart && (
                    <text x={coord.x} y={coord.y - 16} textAnchor="middle" fill="#00d992" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      START
                    </text>
                  )}
                  {isDest && (
                    <text x={coord.x} y={coord.y - 16} textAnchor="middle" fill="#00d992" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      DEST
                    </text>
                  )}

                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isStart || isDest ? 9 : 7}
                    fill={isStart || isDest ? '#00d992' : nodeColor}
                    stroke="#0a0a0a"
                    strokeWidth="2.5"
                    filter={isFocused ? 'url(#glow)' : undefined}
                    className="transition-all duration-300"
                    style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
                  />

                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isStart || isDest ? 12 : 10}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1"
                    opacity={isFocused ? 0.5 : 0}
                    className="transition-opacity duration-300"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-full bg-canvas border-1 border-hairline rounded-lg p-3.5 mt-4 min-h-[60px] flex items-center font-sans">
          {focusedNode ? (
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="font-bold text-ink-strong font-display text-sm">{nodeLabels[focusedNode]}</div>
                <div className="text-xs text-mute flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] uppercase font-mono text-primary">{focusedNode.split('_')[0]}</span>
                  <span className="text-hairline">&middot;</span>
                  <span className={nodeAccessibility[focusedNode] ? 'text-primary' : 'text-red-400'}>
                    {nodeAccessibility[focusedNode] ? 'Wheelchair Accessible' : 'Stairs Only'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-mute font-display uppercase tracking-wider">Live Congestion</div>
                <div className={`text-base font-bold font-mono ${
                  congestionScores[focusedNode] > 0.75 ? 'text-red-400' :
                  congestionScores[focusedNode] > 0.4 ? 'text-yellow-500' : 'text-primary'
                }`}>
                  {Math.round(congestionScores[focusedNode] * 100)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="text-mute italic text-xs w-full text-center font-sans">
              Hover or tap a node to view occupancy and accessibility info
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
