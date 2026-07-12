import React, { Component, ErrorInfo, ReactNode, useState, useRef, useEffect } from 'react';
import { Map, Shield, Bus, Sun, Moon, Eye } from 'lucide-react';
import { ChatAssistant } from './components/ChatAssistant';
import { MapView } from './components/MapView';
import { OpsDashboard } from './components/OpsDashboard';
import { api, TransitResponse } from './lib/api';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full border-1 border-red-500/30 rounded-lg bg-canvas-soft text-center space-y-4 p-8 animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-red-950/50 border-1 border-red-500/30 flex items-center justify-center mx-auto">
              <Shield size={24} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-red-400 font-display">Application Error</h2>
            <p className="text-sm text-mute leading-relaxed">
              Something went wrong while rendering this page. Stadium network telemetry or browser incompatibilities might have occurred.
            </p>
            <pre className="text-xs font-mono bg-canvas p-3 rounded-sm border-1 border-hairline overflow-x-auto text-left text-red-300/80">
              {this.state.error?.message || 'Unknown render error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="py-2.5 px-6 bg-primary text-canvas rounded-lg font-semibold hover:bg-primary-soft transition-all duration-300 w-full active:scale-[0.98]"
            >
              Reload Companion App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

type TabId = 'fan' | 'staff' | 'transit';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'fan', label: 'Fan View', icon: Map },
  { id: 'staff', label: 'Staff Ops', icon: Shield },
  { id: 'transit', label: 'Eco-Transit', icon: Bus },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('fan');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [routeIntent, setRouteIntent] = useState<string | null>(null);
  const [transitOrigin, setTransitOrigin] = useState('Plaza Fan Zone');
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);
  const [isLoadingTransit, setIsLoadingTransit] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: TabId) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (tab === 'transit' && !transitData) {
      fetchTransit(transitOrigin);
    }
  };

  const fetchTransit = async (origin: string) => {
    setIsLoadingTransit(true);
    setTransitError(null);
    try {
      const res = await api.getTransitSuggestions(origin);
      setTransitData(res);
    } catch (err: any) {
      console.error(err);
      setTransitError(err.message || 'Failed to fetch transit ideas.');
    } finally {
      setIsLoadingTransit(false);
    }
  };

  const handleTransitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransit(transitOrigin);
  };

  useEffect(() => {
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [activeTab]);

  return (
    <ErrorBoundary>
      <div data-theme={isDarkMode ? 'dark' : 'light'} className={`h-screen flex flex-col bg-canvas text-ink selection:bg-primary/30 selection:text-white overflow-hidden ${
        highContrast ? 'high-contrast' : ''
      }`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="border-b border-hairline bg-canvas/90 backdrop-blur-xl sticky top-0 z-50 px-4 md:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-[64px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center text-canvas font-bold shadow-lg shadow-primary/20 animate-float">
                <span className="text-sm">PW</span>
              </div>
              <div>
                <h1 className="text-sm font-bold uppercase tracking-[0.15em] text-ink-strong font-tech leading-tight">
                  AI Stadium Companion
                </h1>
                <span className="text-[10px] font-mono text-primary tracking-wider">FIFA World Cup 2026</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="flex items-center bg-canvas-soft rounded-lg p-0.5 border-1 border-hairline" aria-label="Perspective selector">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative py-2 px-3 md:px-4 text-xs font-semibold font-display rounded-md transition-all duration-300 flex items-center gap-1.5 ${
                        isActive
                          ? 'text-canvas'
                          : 'text-mute hover:text-ink hover:bg-canvas-elevated'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-primary-deep shadow-lg shadow-primary/20 animate-scale-in" />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Icon size={14} className={isActive ? 'text-canvas' : ''} />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                type="button"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2.5 rounded-lg border-1 border-hairline hover:border-primary/50 hover:text-primary text-mute transition-all duration-300 flex items-center justify-center bg-canvas-soft hover:bg-canvas-elevated active:scale-95"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                onClick={() => setHighContrast(!highContrast)}
                type="button"
                aria-label={highContrast ? 'Disable high contrast theme' : 'Enable high contrast theme'}
                className={`p-2.5 rounded-lg border-1 border-hairline hover:border-primary/50 hover:text-primary transition-all duration-300 flex items-center justify-center bg-canvas-soft hover:bg-canvas-elevated active:scale-95 ${
                  highContrast ? 'border-primary text-primary' : 'text-mute'
                }`}
                title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
              >
                <Eye size={15} />
              </button>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          ref={contentRef}
          className="flex-1 overflow-y-auto bg-grid bg-glow"
          tabIndex={-1}
        >
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full min-h-full">
            <div className="relative" key={activeTab}>
              {activeTab === 'fan' && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-[calc(100vh-9rem)] animate-tab-content">
                  <div className="xl:col-span-2 h-full">
                    <ChatAssistant onRouteRequested={(intent) => setRouteIntent(intent)} />
                  </div>
                  <div className="xl:col-span-3 h-full">
                    <MapView lastRouteIntent={routeIntent} />
                  </div>
                </div>
              )}

              {activeTab === 'staff' && (
                <div className="animate-tab-content">
                  <OpsDashboard />
                </div>
              )}

              {activeTab === 'transit' && (
                <div className="animate-tab-content">
                  <div className="bg-canvas-soft border-1 border-hairline rounded-xl p-6 md:p-8 max-w-3xl mx-auto space-y-6 card-hover">
                    <div className="flex items-center gap-3 pb-4 border-b border-hairline">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border-1 border-primary/20 flex items-center justify-center">
                        <Bus size={20} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold font-tech uppercase tracking-wider text-ink-strong">Eco-Friendly Transit</h2>
                        <p className="text-xs text-mute font-sans">Zero-emission route suggestions</p>
                      </div>
                    </div>

                    <p className="text-xs text-mute leading-relaxed font-sans">
                      Enter your departure location below. Our AI Stadium Planner will calculate carbon-neutral, zero-emission transportation links tailored to your schedule and accessibility needs.
                    </p>

                    <form onSubmit={handleTransitSearch} className="flex gap-3">
                      <label htmlFor="transit-origin" className="sr-only">Origin departure spot</label>
                      <input
                        id="transit-origin"
                        type="text"
                        value={transitOrigin}
                        onChange={(e) => setTransitOrigin(e.target.value)}
                        placeholder="e.g. Airport Fan Zone, Hotel Grand"
                        className="flex-1 bg-canvas text-ink border-1 border-hairline rounded-lg py-2.5 px-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-mute font-sans text-sm transition-all duration-300"
                      />
                      <button
                        type="submit"
                        disabled={isLoadingTransit || !transitOrigin.trim()}
                        className="py-2.5 px-6 bg-gradient-to-r from-primary to-primary-deep text-canvas font-bold rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-display text-sm shadow-lg shadow-primary/10 active:scale-[0.98]"
                      >
                        {isLoadingTransit ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-canvas/30 border-t-canvas animate-spin" />
                            Searching
                          </span>
                        ) : 'Search'}
                      </button>
                    </form>

                    {transitError && (
                      <div className="p-3 bg-red-950/30 border-1 border-red-500/20 text-red-400 rounded-lg text-xs animate-fade-in-up">
                        {transitError}
                      </div>
                    )}

                    {transitData && (
                      <div className="space-y-6 animate-fade-in-up">
                        <div className="space-y-3">
                          {transitData.options.map((opt, idx) => (
                            <div
                              key={idx}
                              className="p-5 bg-canvas border-1 border-hairline rounded-xl space-y-3 card-hover"
                              style={{ animationDelay: `${idx * 80}ms` }}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[10px] font-bold text-white bg-gradient-to-r from-primary to-primary-deep px-2.5 py-1 rounded-md uppercase tracking-wider">
                                    {opt.mode}
                                  </span>
                                  <span className="font-bold text-ink-strong font-display">{opt.name}</span>
                                </div>
                                <div className="text-right font-mono text-xs">
                                  <span className="font-semibold text-primary">-{Math.round(opt.co2_grams)}g CO₂</span>
                                  <span className="text-mute ml-2">{opt.duration_minutes} min</span>
                                </div>
                              </div>
                              <p className="text-xs text-body leading-relaxed font-sans">{opt.recommendation_reason}</p>
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {opt.accessibility_features.map((feature, fIdx) => (
                                  <span key={fIdx} className="text-[10px] bg-canvas-soft border-1 border-hairline px-2.5 py-1 text-mute rounded-full font-sans">
                                    ♿ {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 bg-emerald-950/20 border-1 border-emerald-500/20 rounded-xl">
                          <p className="text-xs text-emerald-400 leading-relaxed font-sans flex items-start gap-2">
                            <span className="font-bold uppercase tracking-wider font-mono text-[10px] shrink-0">Tip:</span>
                            {transitData.sustainability_tip}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-hairline bg-canvas/90 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto py-3 px-4 md:px-6 flex items-center justify-between text-xs text-mute font-sans">
            <span>FIFA World Cup 2026 AI Stadium Companion</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-radio-pulse" />
              Live Telemetry Connected
            </span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};
