import React, { Component, ErrorInfo, ReactNode, useState, useRef, useEffect } from 'react';
import { Map, Shield, Bus, Sun, Moon, Eye, Zap } from 'lucide-react';
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
  public state: ErrorBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
          <div className="card max-w-md w-full p-8 text-center space-y-5 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <Shield size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-text-strong)' }}>
              System Error
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              An unexpected error occurred. The stadium network telemetry may be temporarily unavailable.
            </p>
            <pre className="text-xs font-mono p-4 rounded-xl overflow-x-auto text-left" style={{
              background: 'var(--color-surface-raised)',
              color: '#f87171',
              border: '1px solid var(--color-border-subtle)'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3 font-display text-sm"
            >
              Reload System
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
  { id: 'fan', label: 'Fan Hub', icon: Map },
  { id: 'staff', label: 'Command', icon: Shield },
  { id: 'transit', label: 'Transit', icon: Bus },
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
    } catch (err: unknown) {
      console.error(err);
      setTransitError(err instanceof Error ? err.message : 'Failed to fetch transit data.');
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
      <div
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={`h-screen flex flex-col overflow-hidden ${highContrast ? 'high-contrast' : ''}`}
        style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <div className="aurora-bg" />
        <div className="grid-bg fixed inset-0 z-0 pointer-events-none" />

        <nav
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down"
          aria-label="Main navigation"
        >
          <div className="glass-heavy rounded-full px-2 py-1.5 shadow-float flex items-center gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow-sm">
                <Zap size={14} className="text-white" />
              </div>
              <span className="hidden md:block text-xs font-bold font-display tracking-wide" style={{ color: 'var(--color-text-strong)' }}>
                StadiumOS
              </span>
            </div>

            <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-4 py-2 text-xs font-semibold font-display rounded-full transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'text-white'
                      : 'hover:bg-white/5'
                  }`}
                  style={{ color: isActive ? undefined : 'var(--color-text-secondary)' }}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-accent to-accent-dark shadow-glow-sm animate-scale-in" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}

            <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />

            <div className="flex items-center gap-1 pr-1">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                type="button"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-full transition-all duration-300 hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={() => setHighContrast(!highContrast)}
                type="button"
                aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                className={`p-2 rounded-full transition-all duration-300 hover:bg-white/5 ${
                  highContrast ? 'text-accent' : ''
                }`}
                style={{ color: highContrast ? undefined : 'var(--color-text-muted)' }}
              >
                <Eye size={14} />
              </button>
            </div>
          </div>
        </nav>

        <main
          id="main-content"
          ref={contentRef}
          className="flex-1 overflow-y-auto pt-20 relative z-10"
          tabIndex={-1}
        >
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full min-h-full">
            <div key={activeTab} className="animate-fade-in">
              {activeTab === 'fan' && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 min-h-[calc(100vh-7rem)]">
                  <div className="xl:col-span-2 h-full">
                    <ChatAssistant onRouteRequested={(intent) => setRouteIntent(intent)} />
                  </div>
                  <div className="xl:col-span-3 h-full">
                    <MapView lastRouteIntent={routeIntent} />
                  </div>
                </div>
              )}

              {activeTab === 'staff' && (
                <OpsDashboard />
              )}

              {activeTab === 'transit' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="card p-8 space-y-6">
                    <div className="flex items-center gap-4 pb-5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Bus size={22} className="text-accent" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold font-display" style={{ color: 'var(--color-text-strong)' }}>
                          Eco-Transit Navigator
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Zero-emission route suggestions powered by AI
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Enter your departure location and our AI will calculate carbon-neutral transportation options tailored to your schedule and accessibility needs.
                    </p>

                    <form onSubmit={handleTransitSearch} className="flex gap-3">
                      <label htmlFor="transit-origin" className="sr-only">Departure location</label>
                      <input
                        id="transit-origin"
                        type="text"
                        value={transitOrigin}
                        onChange={(e) => setTransitOrigin(e.target.value)}
                        placeholder="e.g. Downtown Hotel, Airport Terminal"
                        className="input-field flex-1 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isLoadingTransit || !transitOrigin.trim()}
                        className="btn-primary px-6 text-sm whitespace-nowrap"
                      >
                        {isLoadingTransit ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Searching
                          </span>
                        ) : 'Search Routes'}
                      </button>
                    </form>

                    {transitError && (
                      <div className="p-4 rounded-xl text-sm animate-fade-in-up" style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        color: '#f87171'
                      }}>
                        {transitError}
                      </div>
                    )}

                    {transitData && (
                      <div className="space-y-5 animate-fade-in-up">
                        <div className="space-y-3">
                          {transitData.options.map((opt, idx) => (
                            <div
                              key={idx}
                              className="card-elevated p-5 space-y-3"
                              style={{ animationDelay: `${idx * 80}ms` }}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="badge badge-accent">{opt.mode}</span>
                                  <span className="font-bold text-sm font-display" style={{ color: 'var(--color-text-strong)' }}>
                                    {opt.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-mono">
                                  <span className="text-success font-semibold">-{Math.round(opt.co2_grams)}g CO₂</span>
                                  <span style={{ color: 'var(--color-text-muted)' }}>{opt.duration_minutes} min</span>
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {opt.recommendation_reason}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                {opt.accessibility_features.map((feature, fIdx) => (
                                  <span key={fIdx} className="text-[10px] px-2.5 py-1 rounded-full font-sans" style={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border-subtle)',
                                    color: 'var(--color-text-muted)'
                                  }}>
                                    ♿ {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 rounded-xl" style={{
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.15)'
                        }}>
                          <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: '#34d399' }}>
                            <span className="font-bold uppercase tracking-wider font-mono text-[10px] shrink-0 mt-0.5">Tip</span>
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
      </div>
    </ErrorBoundary>
  );
};
