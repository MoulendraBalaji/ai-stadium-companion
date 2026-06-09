import { BENCHMARKS } from '../utils/carbonCalculations';

export default function Dashboard({ emissions }) {
  const { transport, energy, food, shopping, total } = emissions;

  // Compute Grade & Rating
  const getGrade = (val) => {
    if (val <= 2.0) return { letter: 'A+', text: 'Climate Hero', color: 'var(--accent-secondary)', bg: 'rgba(48, 209, 88, 0.1)' };
    if (val <= 4.5) return { letter: 'A', text: 'Eco Champion', color: 'var(--info)', bg: 'rgba(100, 210, 255, 0.1)' };
    if (val <= 7.0) return { letter: 'B', text: 'Green Pioneer', color: 'var(--accent-primary)', bg: 'rgba(0, 113, 227, 0.1)' };
    if (val <= 12.0) return { letter: 'C', text: 'Moderate Consumer', color: 'var(--warning)', bg: 'rgba(255, 159, 10, 0.1)' };
    return { letter: 'D', text: 'Heavy Footprint', color: 'var(--danger)', bg: 'rgba(255, 69, 58, 0.1)' };
  };

  const grade = getGrade(total);

  // Math for SVG Donut Chart
  const sectors = [
    { label: 'Transport', value: transport, color: '#30d158' }, // Apple Green
    { label: 'Energy', value: energy, color: '#0071e3' },    // Apple Blue
    { label: 'Food', value: food, color: '#ff9f0a' },      // Apple Orange
    { label: 'Shopping', value: shopping, color: '#bf5af2' }  // Apple Purple
  ];

  const totalEmissions = Math.max(0.1, transport + energy + food + shopping);
  
  // Donut values configuration
  const radius = 70;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius; // ~439.82
  
  let accumulatedPercent = 0;
  const donutSlices = sectors.map((sector) => {
    const percent = sector.value / totalEmissions;
    const dashArray = `${(percent * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    const dashOffset = -(accumulatedPercent * circumference).toFixed(2);
    accumulatedPercent += percent;

    return {
      ...sector,
      percent: (percent * 100).toFixed(1),
      dashArray,
      dashOffset
    };
  });

  return (
    <div className="grid-2 animate-fade-in">
      {/* Left Column: Footprint Score & Graphic */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="card-title-container">
            <span className="card-icon" aria-hidden="true">📊</span>
            <h2>Your Carbon Footprint</h2>
          </div>
          <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
            Calculated annual greenhouse gas emissions in metric tons of CO2 equivalent (tCO2e/yr).
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
          {/* SVG Donut */}
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 200 200" 
              role="img" 
              aria-label={`Donut chart representing carbon footprint breakdown. Total is ${total} tons.`}
            >
              <title>Emission Distribution Chart</title>
              {/* Empty background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="var(--bg-tertiary)"
                strokeWidth={strokeWidth}
              />
              {total > 0 && donutSlices.map((slice) => (
                <circle
                  key={slice.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  transform="rotate(-90 100 100)"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              ))}
            </svg>
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <span style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
                {total.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Tons CO2e
              </span>
            </div>
          </div>

          {/* Legend and sector breakdowns */}
          <div style={{ flex: '1', minWidth: '150px' }}>
            {donutSlices.map((slice) => (
              <div 
                key={slice.label} 
                className="flex-between" 
                style={{ 
                  padding: '0.4rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  fontSize: '0.9rem' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: slice.color }} />
                  <span style={{ fontWeight: '500' }}>{slice.label}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{slice.value.toFixed(1)} t</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                    ({total > 0 ? slice.percent : '0'}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Score Breakdown & Comparison Benchmarks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Grade Card */}
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.5rem', 
            borderColor: grade.color, 
            background: `linear-gradient(135deg, var(--bg-secondary), ${grade.bg})` 
          }}
        >
          <div 
            style={{ 
              fontSize: '2.5rem', 
              fontWeight: '900', 
              width: '75px', 
              height: '75px', 
              borderRadius: '50%', 
              backgroundColor: grade.color, 
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              boxShadow: `0 0 15px ${grade.color}40`
            }}
          >
            {grade.letter}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Climate Rating: {grade.text}</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
              {total <= 2.0 
                ? 'Excellent! Your footprint matches targets required to halt global warming.' 
                : total <= 7.0 
                ? 'Good job. You are below average, but simple adjustments can bring you closer to sustainability.' 
                : 'Your carbon footprint is above recommended levels. Try executing the actions listed in the Habit Tracker.'}
            </p>
          </div>
        </div>

        {/* Benchmarks comparison */}
        <div className="card">
          <div className="card-title-container">
            <span className="card-icon" aria-hidden="true">⚖️</span>
            <h3>How You Compare</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {[
              { label: 'Your Footprint', value: total, color: 'var(--accent-primary)', isUser: true },
              { label: 'Sustainable Target', value: BENCHMARKS.sustainableTarget, color: 'var(--accent-tertiary)' },
              { label: 'Global Average', value: BENCHMARKS.globalAverage, color: 'var(--info)' },
              { label: 'Europe Average', value: BENCHMARKS.europeAverage, color: 'var(--warning)' },
              { label: 'US Average', value: BENCHMARKS.usAverage, color: 'var(--danger)' }
            ].map((benchmark) => {
              const maxVal = Math.max(total, BENCHMARKS.usAverage);
              const percentage = (benchmark.value / maxVal) * 100;
              
              return (
                <div key={benchmark.label}>
                  <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: benchmark.isUser ? '700' : '500', color: benchmark.isUser ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {benchmark.label} {benchmark.isUser && '⭐'}
                    </span>
                    <span style={{ fontWeight: '700' }}>{benchmark.value.toFixed(1)} tCO2e</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: benchmark.color,
                        borderRadius: '4px',
                        transition: 'width var(--transition-slow)'
                      }} 
                      role="presentation"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
