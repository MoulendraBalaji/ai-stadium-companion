import React, { useState } from 'react';
import { 
  calculateTransportEmissions, 
  calculateEnergyEmissions, 
  calculateFoodEmissions, 
  calculateShoppingEmissions 
} from '../utils/carbonCalculations';

export default function Simulator({ originalInputs, baselineEmissions }) {
  // Simulator sliders states (percentages of action)
  const [driveReduction, setDriveReduction] = useState(0);   // 0 to 100%
  const [greenPower, setGreenPower] = useState(originalInputs.energy.greenEnergy || 0);       // current to 100%
  const [dietShift, setDietShift] = useState(0);             // 0 (current) to 100 (fully vegan)
  const [shoppingReduction, setShoppingReduction] = useState(0); // 0 to 50% reduction

  // Ensure green power slider isn't less than original input
  const currentGreenPower = Math.max(originalInputs.energy.greenEnergy || 0, greenPower);

  // Compute simulated inputs
  const simulatedTransportInputs = {
    ...originalInputs.transport,
    carKm: (originalInputs.transport.carKm || 0) * (1 - driveReduction / 100)
  };

  const simulatedEnergyInputs = {
    ...originalInputs.energy,
    greenEnergy: currentGreenPower
  };

  // Diet blending
  const baseFoodEmissions = calculateFoodEmissions(originalInputs.food);
  const veganFoodEmissions = calculateFoodEmissions({ dietType: 'vegan', foodWaste: 'low' });
  const simulatedFoodEmissions = baseFoodEmissions - ((baseFoodEmissions - veganFoodEmissions) * (dietShift / 100));

  // Shopping blending
  const baseShoppingEmissions = calculateShoppingEmissions(originalInputs.shopping);
  const simulatedShoppingEmissions = baseShoppingEmissions * (1 - (shoppingReduction / 100));

  // Run calculations
  const simTransport = calculateTransportEmissions(simulatedTransportInputs);
  const simEnergy = calculateEnergyEmissions(simulatedEnergyInputs);
  const simFood = simulatedFoodEmissions;
  const simShopping = simulatedShoppingEmissions;

  const simTotal = simTransport + simEnergy + simFood + simShopping;
  const baselineTotal = Math.max(0.1, baselineEmissions.total);
  const co2Saved = Math.max(0, baselineTotal - simTotal);
  const percentSaved = (co2Saved / baselineTotal) * 100;

  return (
    <div className="grid-2 animate-fade-in">
      {/* Left Column: Sliders */}
      <div className="card">
        <div className="card-title-container">
          <span className="card-icon" aria-hidden="true">🎛️</span>
          <h2>Adjust Your Scenarios</h2>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Drag the sliders to simulate changes in your daily routines and see the carbon impact.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Slider 1: Drive Reduction */}
          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="slider-drive" style={{ margin: 0 }}>
                Reduce Driving Distance
              </label>
              <span style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{driveReduction}% less</span>
            </div>
            <input 
              type="range" 
              id="slider-drive" 
              min="0" 
              max="100" 
              value={driveReduction} 
              onChange={(e) => setDriveReduction(parseInt(e.target.value))} 
            />
            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
              Simulates replacing car trips with transit, cycling, or working from home.
            </span>
          </div>

          {/* Slider 2: Green Electricity */}
          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="slider-green-power" style={{ margin: 0 }}>
                Switch to Renewable Electricity
              </label>
              <span style={{ fontWeight: '700', color: 'var(--info)' }}>{currentGreenPower}% green</span>
            </div>
            <input 
              type="range" 
              id="slider-green-power" 
              min="0" 
              max="100" 
              value={currentGreenPower} 
              onChange={(e) => setGreenPower(parseInt(e.target.value))} 
            />
            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
              Simulates switching to solar panels or purchasing 100% green energy contracts.
            </span>
          </div>

          {/* Slider 3: Diet Shift */}
          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="slider-diet" style={{ margin: 0 }}>
                Adopt Plant-Based Diet
              </label>
              <span style={{ fontWeight: '700', color: 'var(--warning)' }}>{dietShift}% transition</span>
            </div>
            <input 
              type="range" 
              id="slider-diet" 
              min="0" 
              max="100" 
              value={dietShift} 
              onChange={(e) => setDietShift(parseInt(e.target.value))} 
            />
            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
              Simulates moving from your current diet towards an entirely low-impact vegan lifestyle.
            </span>
          </div>

          {/* Slider 4: Shopping Reduction */}
          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="slider-shopping" style={{ margin: 0 }}>
                Reduce Purchases & Recycle
              </label>
              <span style={{ fontWeight: '700', color: 'var(--accent-tertiary)' }}>{shoppingReduction}% reduction</span>
            </div>
            <input 
              type="range" 
              id="slider-shopping" 
              min="0" 
              max="50" 
              value={shoppingReduction} 
              onChange={(e) => setShoppingReduction(parseInt(e.target.value))} 
            />
            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
              Simulates buying fewer new items, choosing secondhand goods, and minimizing packaging.
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Comparison */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="card-title-container">
            <span className="card-icon" aria-hidden="true">📉</span>
            <h2>Projected Reductions</h2>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Compare your baseline footprint with your potential simulated target.
          </p>
        </div>

        {/* Real-time comparison metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', textTransform: 'uppercase' }}>Baseline</span>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>{baselineTotal.toFixed(2)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>t CO2e</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--accent-secondary)' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', textTransform: 'uppercase' }}>Simulated</span>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-secondary)' }}>{simTotal.toFixed(2)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>t CO2e</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--card-border)' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Potential Annual Savings</span>
            <span style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--accent-primary)', display: 'block', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
              {co2Saved.toFixed(2)} Tons
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', fontWeight: '600' }}>
              ({percentSaved.toFixed(1)}% reduction from baseline)
            </span>
          </div>
        </div>

        {/* Visual Bar Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <div>
            <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Baseline Footprint</span>
              <span>100%</span>
            </div>
            <div style={{ height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px' }}>
              <div style={{ height: '100%', width: '100%', backgroundColor: 'var(--text-secondary)', borderRadius: '5px' }} />
            </div>
          </div>
          <div>
            <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Simulated Target</span>
              <span>{Math.max(0, (simTotal / baselineTotal) * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${Math.min(100, Math.max(0, (simTotal / baselineTotal) * 100))}%`, 
                  backgroundColor: 'var(--accent-primary)', 
                  borderRadius: '5px',
                  transition: 'width var(--transition-normal)'
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
