import React, { useState } from 'react';

export default function Calculator({ inputs, setInputs, onCalculate }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const updateSector = (sector, key, value) => {
    const numericVal = value === '' ? 0 : value;
    setInputs(prev => {
      const updated = {
        ...prev,
        [sector]: {
          ...prev[sector],
          [key]: numericVal
        }
      };
      return updated;
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      onCalculate(`Moved to Step ${step + 1}: ${getStepName(step + 1)}`);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      onCalculate(`Moved back to Step ${step - 1}: ${getStepName(step - 1)}`);
    }
  };

  const getStepName = (s) => {
    switch (s) {
      case 1: return 'Transportation';
      case 2: return 'Home Energy';
      case 3: return 'Diet & Food';
      case 4: return 'Shopping & Waste';
      default: return '';
    }
  };

  const prefillAverages = () => {
    setInputs({
      transport: { carKm: 12000, carType: 'gasoline', transitKm: 2000, shortFlights: 2, longFlights: 1 },
      energy: { electricityKwh: 350, greenEnergy: 10, heatingFuel: 'gas', heatingAmount: 400, householdSize: 2 },
      food: { dietType: 'average', foodWaste: 'medium' },
      shopping: { clothes: 'medium', electronics: 'medium', recycle: 'some' }
    });
    onCalculate('Calculator prefilled with average regional benchmark values.');
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
      {/* Progress Bar & Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
          <span className="badge badge-info">Step {step} of {totalSteps}</span>
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{getStepName(step)}</span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${(step / totalSteps) * 100}%`, 
              background: 'var(--accent-primary)',
              transition: 'width var(--transition-normal)'
            }} 
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin="1"
            aria-valuemax={totalSteps}
            aria-label={`Calculator progress: Step ${step} of ${totalSteps}`}
          />
        </div>
      </div>

      {/* Step Contents */}
      <form onSubmit={(e) => e.preventDefault()} aria-label={`Footprint Calculator Step ${step}: ${getStepName(step)}`}>
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.25rem' }}>Transportation Habits</h3>
            
            <div className="form-group">
              <label className="form-label" htmlFor="car-km">Annual Driving Distance (km)</label>
              <input 
                type="number" 
                id="car-km"
                min="0"
                className="form-input" 
                value={inputs.transport.carKm || ''} 
                onChange={(e) => updateSector('transport', 'carKm', Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="e.g. 10000"
              />
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                Enter the total kilometers you drive in a year.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="car-type">Vehicle Fuel Type</label>
              <select 
                id="car-type" 
                className="form-select"
                value={inputs.transport.carType}
                onChange={(e) => updateSector('transport', 'carType', e.target.value)}
              >
                <option value="gasoline">Gasoline / Petrol (Average)</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric (EV)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="transit-km">Annual Public Transit (km)</label>
              <input 
                type="number" 
                id="transit-km"
                min="0"
                className="form-input" 
                value={inputs.transport.transitKm || ''} 
                onChange={(e) => updateSector('transport', 'transitKm', Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="e.g. 2500"
              />
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                Includes bus, subway, commuter train, and tram travel.
              </span>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="short-flights">Short Flights / yr (&lt; 3h)</label>
                <input 
                  type="number" 
                  id="short-flights"
                  min="0"
                  className="form-input" 
                  value={inputs.transport.shortFlights || ''} 
                  onChange={(e) => updateSector('transport', 'shortFlights', Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="long-flights">Long Flights / yr (&ge; 3h)</label>
                <input 
                  type="number" 
                  id="long-flights"
                  min="0"
                  className="form-input" 
                  value={inputs.transport.longFlights || ''} 
                  onChange={(e) => updateSector('transport', 'longFlights', Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.25rem' }}>Home Energy Consumption</h3>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="electricity-kwh">Monthly Electricity (kWh)</label>
                <input 
                  type="number" 
                  id="electricity-kwh"
                  min="0"
                  className="form-input" 
                  value={inputs.energy.electricityKwh || ''} 
                  onChange={(e) => updateSector('energy', 'electricityKwh', Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 300"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="green-energy">Green Electricity (%)</label>
                <input 
                  type="number" 
                  id="green-energy"
                  min="0"
                  max="100"
                  className="form-input" 
                  value={inputs.energy.greenEnergy || ''} 
                  onChange={(e) => updateSector('energy', 'greenEnergy', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  placeholder="e.g. 0"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="heating-fuel">Primary Heating Source</label>
                <select 
                  id="heating-fuel" 
                  className="form-select"
                  value={inputs.energy.heatingFuel}
                  onChange={(e) => updateSector('energy', 'heatingFuel', e.target.value)}
                >
                  <option value="gas">Natural Gas</option>
                  <option value="oil">Heating Oil</option>
                  <option value="electric">Electric Heater</option>
                  <option value="none">No Heating / Passive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="heating-amount">Monthly Heating (kWh)</label>
                <input 
                  type="number" 
                  id="heating-amount"
                  min="0"
                  className="form-input" 
                  value={inputs.energy.heatingAmount || ''} 
                  onChange={(e) => updateSector('energy', 'heatingAmount', Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 400"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="household-size">Household Size (People)</label>
              <input 
                type="number" 
                id="household-size"
                min="1"
                className="form-input" 
                value={inputs.energy.householdSize || ''} 
                onChange={(e) => updateSector('energy', 'householdSize', Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="1"
              />
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                We divide shared home energy emissions by the number of residents.
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.25rem' }}>Dietary & Food Habits</h3>

            <div className="form-group">
              <label className="form-label">Primary Diet Profile</label>
              <div className="segmented-control" role="radiogroup" aria-label="Dietary Profile">
                {['meat-heavy', 'average', 'low-meat', 'vegetarian', 'vegan'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={inputs.food.dietType === type}
                    className={`segmented-btn ${inputs.food.dietType === type ? 'active' : ''}`}
                    onClick={() => updateSector('food', 'dietType', type)}
                    style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                  >
                    {type.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                Meat production (especially beef and lamb) carries a high methane carbon footprint compared to plant proteins.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="food-waste">Food Waste Habits</label>
              <select 
                id="food-waste" 
                className="form-select"
                value={inputs.food.foodWaste}
                onChange={(e) => updateSector('food', 'foodWaste', e.target.value)}
              >
                <option value="low">Low (Rarely throw out edible food)</option>
                <option value="medium">Medium (Occasional leftovers thrown out)</option>
                <option value="high">High (Frequent food waste/expired groceries)</option>
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.25rem' }}>Shopping & Consumption</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="clothes-buying">Clothing Purchases</label>
              <select 
                id="clothes-buying" 
                className="form-select"
                value={inputs.shopping.clothes}
                onChange={(e) => updateSector('shopping', 'clothes', e.target.value)}
              >
                <option value="low">Low (Thrift store buyer, minimal clothes bought)</option>
                <option value="medium">Medium (Average retail buying habits)</option>
                <option value="high">High (Frequent purchases, fast fashion brand follower)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="electronics-buying">Tech & Electronics Purchases</label>
              <select 
                id="electronics-buying" 
                className="form-select"
                value={inputs.shopping.electronics}
                onChange={(e) => updateSector('shopping', 'electronics', e.target.value)}
              >
                <option value="low">Low (Repair items, upgrade gadgets only when broken)</option>
                <option value="medium">Medium (Upgrade when devices slow down or contract ends)</option>
                <option value="high">High (Always purchase latest models, high tech household)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="recycling-habit">Recycling Habits</label>
              <select 
                id="recycling-habit" 
                className="form-select"
                value={inputs.shopping.recycle}
                onChange={(e) => updateSector('shopping', 'recycle', e.target.value)}
              >
                <option value="all">Full recycling (Recycle glass, tin, paper, and plastic)</option>
                <option value="some">Partial recycling (Recycle some paper/bottles)</option>
                <option value="none">No recycling (Throw everything in general trash)</option>
              </select>
            </div>
          </div>
        )}

        {/* Form Action Controls */}
        <div className="flex-between" style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={handlePrev}>
              &larr; Back
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={prefillAverages}>
              ⚡ Prefill Averages
            </button>
          )}

          {step < totalSteps ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next Step &rarr;
            </button>
          ) : (
            <span style={{ color: 'var(--accent-secondary)', fontWeight: '700', fontSize: '0.95rem' }}>
              ✓ All Data Synced Reactively
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
