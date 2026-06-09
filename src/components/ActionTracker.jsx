import { useState } from 'react';
import { ACTIONS } from '../utils/actionDatabase';

export default function ActionTracker({ loggedActions, onLogAction, onRemoveAction }) {
  const [filter, setFilter] = useState('all');

  // Math for calculations
  const totalSavedKg = loggedActions.reduce((sum, item) => sum + item.co2SavedKg, 0);
  const totalPoints = loggedActions.reduce((sum, item) => sum + item.points, 0);
  
  // Levels: 100 points per level
  const pointsPerLevel = 100;
  const userLevel = Math.floor(totalPoints / pointsPerLevel) + 1;
  const pointsToNextLevel = pointsPerLevel - (totalPoints % pointsPerLevel);
  const levelProgressPercent = ((totalPoints % pointsPerLevel) / pointsPerLevel) * 100;

  const getLevelName = (lvl) => {
    if (lvl === 1) return 'Eco Seedling';
    if (lvl === 2) return 'Active Sapling';
    if (lvl === 3) return 'Green Sprout';
    if (lvl === 4) return 'Carbon Cutter';
    if (lvl === 5) return 'Climate Shield';
    return 'Forest Guardian';
  };

  const filteredActions = ACTIONS.filter(action => {
    if (filter === 'all') return true;
    return action.category === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Gamified Level & Progress Bar Card */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--card-border)'
        }}
      >
        <div className="grid-3" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Level {userLevel}
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-secondary)' }}>
              {getLevelName(userLevel)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total CO2 Saved
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {totalSavedKg.toFixed(1)} kg
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Points Earned
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--info)' }}>
              {totalPoints} XP
            </span>
          </div>
        </div>

        <div>
          <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            <span>Progress to Next Level</span>
            <span>{totalPoints % pointsPerLevel} / {pointsPerLevel} XP ({pointsToNextLevel} XP left)</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${levelProgressPercent}%`, 
                background: 'var(--accent-primary)',
                transition: 'width var(--transition-normal)'
              }}
              role="progressbar"
              aria-valuenow={totalPoints % pointsPerLevel}
              aria-valuemin="0"
              aria-valuemax={pointsPerLevel}
              aria-label="Experience points level progress"
            />
          </div>
        </div>
      </div>

      {/* Action Logging Hub */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start', gap: '1.5rem' }}>
        
        {/* Left: Action Catalog */}
        <div className="card">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Log Green Actions</h3>
            {/* Filter Tabs */}
            <div className="segmented-control" role="tablist" aria-label="Action categories">
              {['all', 'transport', 'energy', 'food', 'shopping'].map(cat => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={filter === cat}
                  onClick={() => setFilter(cat)}
                  className={`segmented-btn ${filter === cat ? 'active' : ''}`}
                  style={{ textTransform: 'capitalize', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div 
            tabIndex="0"
            aria-label="Predefined action catalog"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}
          >
            {filteredActions.map(action => (
              <div 
                key={action.id}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: '1' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{action.title}</span>
                    <span className={`badge ${action.difficulty === 'easy' ? 'badge-success' : action.difficulty === 'medium' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {action.difficulty}
                    </span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{action.description}</p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                    <span style={{ color: 'var(--accent-secondary)' }}>-{action.co2SavedKg} kg</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }}>•</span>
                    <span style={{ color: 'var(--accent-tertiary)' }}>+{action.points} XP</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => onLogAction(action)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    aria-label={`Log action: ${action.title}`}
                  >
                    Log +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: History log */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '550px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Log History ({loggedActions.length})</h3>
          
          {loggedActions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', margin: 'auto' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
              <p style={{ fontSize: '0.85rem' }}>No actions logged today yet. Log items from the menu to start saving carbon!</p>
            </div>
          ) : (
            <div 
              tabIndex="0"
              aria-label="Logged actions history list"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}
            >
              {loggedActions.map((log) => (
                <div 
                  key={log.logId}
                  style={{ 
                    padding: '0.6rem 0.75rem', 
                    borderRadius: '8px', 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                    <span style={{ fontWeight: '600', display: 'block' }}>{log.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: '700' }}>-{log.co2SavedKg} kg</span>
                    <button 
                      type="button" 
                      onClick={() => onRemoveAction(log.logId, log.title)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--danger)', 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '0.2rem'
                      }}
                      aria-label={`Delete log for ${log.title}`}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
