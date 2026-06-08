import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import ActionTracker from './components/ActionTracker';
import Simulator from './components/Simulator';
import Insights from './components/Insights';
import AriaLiveMessenger from './components/AriaLiveMessenger';
import { calculateCarbonFootprint } from './utils/carbonCalculations';

// Sensible initial defaults if offline and no local storage exists
const DEFAULT_INPUTS = {
  transport: {
    carKm: 12000,
    carType: 'gasoline',
    transitKm: 2500,
    shortFlights: 2,
    longFlights: 1
  },
  energy: {
    electricityKwh: 320,
    greenEnergy: 15,
    heatingFuel: 'gas',
    heatingAmount: 350,
    householdSize: 2
  },
  food: {
    dietType: 'average',
    foodWaste: 'medium'
  },
  shopping: {
    clothes: 'medium',
    electronics: 'medium',
    recycle: 'some'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [loggedActions, setLoggedActions] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Initial Data from Backend API or fall back to LocalStorage
  useEffect(() => {
    const initializeData = async () => {
      try {
        const resInputs = await fetch('/api/inputs');
        if (!resInputs.ok) throw new Error('API inputs fetch failed');
        const dataInputs = await resInputs.json();
        setInputs(dataInputs);

        const resActions = await fetch('/api/actions');
        if (!resActions.ok) throw new Error('API actions fetch failed');
        const dataActions = await resActions.json();
        setLoggedActions(dataActions);

        setIsOffline(false);
        setIsLoaded(true);
        console.log('Successfully synced data from CarbonPulse Backend API.');
      } catch (err) {
        console.warn('CarbonPulse Backend API is offline. Loading from local cache:', err);
        setIsOffline(true);

        // Fallback to LocalStorage
        const savedInputs = localStorage.getItem('carbonpulse_inputs');
        if (savedInputs) {
          setInputs(JSON.parse(savedInputs));
        } else {
          setInputs(DEFAULT_INPUTS);
        }

        const savedActions = localStorage.getItem('carbonpulse_actions');
        if (savedActions) {
          setLoggedActions(JSON.parse(savedActions));
        }

        setIsLoaded(true);
      }
    };
    initializeData();
  }, []);

  // Sync inputs changes to Backend & LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    
    // Always update LocalStorage for caching
    localStorage.setItem('carbonpulse_inputs', JSON.stringify(inputs));

    // Post to Express backend if online
    if (!isOffline) {
      fetch('/api/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      }).catch(err => {
        console.error('Failed to sync inputs to backend, switching to local mode:', err);
        setIsOffline(true);
      });
    }
  }, [inputs, isLoaded, isOffline]);

  // Sync logged actions changes to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('carbonpulse_actions', JSON.stringify(loggedActions));
  }, [loggedActions, isLoaded]);

  // Re-run calculations reactively
  const emissions = calculateCarbonFootprint(inputs);

  // Triggered when a new action is logged
  const handleLogAction = async (action) => {
    const newLog = {
      ...action,
      logId: Date.now().toString(),
      timestamp: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Optimistic UI updates
    setLoggedActions(prev => [newLog, ...prev]);
    setAnnouncement(`Logged: ${action.title}. Saved ${action.co2SavedKg} kg CO2.`);

    // Sync to API
    if (!isOffline) {
      try {
        const res = await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        });
        if (!res.ok) throw new Error('API save action failed');
      } catch (err) {
        console.error('Failed to save action to backend:', err);
        setIsOffline(true);
      }
    }
  };

  // Triggered when a logged action is removed/undone
  const handleRemoveAction = async (logId, title) => {
    setLoggedActions(prev => prev.filter(item => item.logId !== logId));
    setAnnouncement(`Removed action: ${title}.`);

    // Sync to API
    if (!isOffline) {
      try {
        const res = await fetch(`/api/actions/${logId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('API delete action failed');
      } catch (err) {
        console.error('Failed to delete action from backend:', err);
        setIsOffline(true);
      }
    }
  };

  const handleTabChange = (tabId, tabName) => {
    setActiveTab(tabId);
    setAnnouncement(`Navigated to ${tabName} panel.`);
  };

  return (
    <>
      {/* Skip navigation link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Screen Reader Live announcements */}
      <AriaLiveMessenger announcement={announcement} />

      {/* Main Layout Header (Frosted Apple Nav Bar) */}
      <header 
        style={{ 
          borderBottom: '1px solid var(--card-border)', 
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(22, 22, 23, 0.8)'
        }}
      >
        <div className="container flex-between" style={{ padding: '0.75rem 1.5rem' }}>
          {/* Logo & Connection Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1rem', color: '#ffffff' }}>🌱</span>
            </div>
            <div>
              <h1 style={{ fontSize: '1.05rem', fontWeight: '600', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                CarbonPulse
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                {isOffline ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                    ⚠️ Local Mode
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                    ● Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Apple Segmented Bar) */}
          <nav role="tablist" aria-label="Main Panels" className="segmented-control" style={{ maxWidth: '600px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'calculator', label: 'Calculator', icon: '⚡' },
              { id: 'tracker', label: 'Habit Tracker', icon: '📝' },
              { id: 'simulator', label: 'Simulator', icon: '🎛️' },
              { id: 'insights', label: 'Insights', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`segmented-btn ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
                onClick={() => handleTabChange(tab.id, tab.label)}
              >
                <span className="nav-label-text">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Help Modal Button */}
          <div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowHelpModal(true)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: 'var(--border-radius-pill)' }}
              aria-label="Open instructions guide"
            >
              Help Guide
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main id="main-content" className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
        <h2 className="sr-only">Main content section</h2>
        {activeTab === 'dashboard' && <Dashboard emissions={emissions} />}
        {activeTab === 'calculator' && (
          <Calculator 
            inputs={inputs} 
            setInputs={setInputs} 
            onCalculate={setAnnouncement} 
          />
        )}
        {activeTab === 'tracker' && (
          <ActionTracker 
            loggedActions={loggedActions} 
            onLogAction={handleLogAction} 
            onRemoveAction={handleRemoveAction} 
          />
        )}
        {activeTab === 'simulator' && (
          <Simulator 
            originalInputs={inputs} 
            baselineEmissions={emissions} 
          />
        )}
        {activeTab === 'insights' && <Insights inputs={inputs} emissions={emissions} />}
      </main>

      {/* Footer (Minimal Apple Footer style) */}
      <footer 
        style={{ 
          borderTop: '1px solid var(--card-border)', 
          textAlign: 'center', 
          padding: '2rem 1.5rem', 
          color: 'var(--text-muted)', 
          fontSize: '0.75rem',
          background: 'var(--bg-primary)'
        }}
      >
        <p style={{ maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Copyright © 2026 CarbonPulse Inc. All rights reserved. 
          <br />
          Built using a secure Node.js backend. Screen-power optimized for energy conservation.
        </p>
      </footer>

      {/* Informative Help Modal (Apple HIG Style dialog box) */}
      {showHelpModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="card animate-fade-in" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              background: '#1c1c1e', 
              borderColor: '#2c2c2e',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: '20px',
              padding: '2rem'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <h3 id="modal-title" style={{ fontSize: '1.3rem', fontWeight: '600' }}>🌱 CarbonPulse HIG Guide</h3>
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '1.4rem'
                }}
                aria-label="Close information guide"
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <p>
                <strong>What is a Carbon Footprint?</strong><br />
                It represents the sum of greenhouse gases (carbon dioxide and methane) emitted by our lifestyle choices. The global per-capita average is <strong>4.5 tons</strong>; however, halting warming above 1.5°C requires a targets limit of <strong>2.0 tons</strong>.
              </p>
              <div>
                <p style={{ marginBottom: '0.4rem' }}><strong>Workflow Overview:</strong></p>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li>Determine your current score using the step-by-step <strong>Calculator</strong>.</li>
                  <li>Check your rating letter grade and benchmarks in the <strong>Dashboard</strong>.</li>
                  <li>Log habits completed in the <strong>Habit Tracker</strong> to cut emissions and gain XP levels.</li>
                  <li>Model changes dynamically with the <strong>Simulator</strong> range sliders.</li>
                  <li>Read tailored advice in the <strong>Insights</strong> tab.</li>
                </ol>
              </div>
              <p>
                <strong>Backend & Cloud Persistence:</strong><br />
                CarbonPulse utilizes a Node.js Express server to persist inputs. When offline, it switches to local caches automatically.
              </p>
            </div>

            <div style={{ textAlign: 'right', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowHelpModal(false)}
                style={{ borderRadius: 'var(--border-radius-pill)', padding: '0.5rem 1.25rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
