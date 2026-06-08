import React from 'react';

export default function Insights({ inputs, emissions }) {
  const { transport, energy, food, shopping, total } = emissions;

  // Generate customized advice lists based on actual user inputs
  const generateInsights = () => {
    const list = [];

    // 1. Transport recommendations
    if (inputs.transport.carKm > 8000) {
      const reductionPot = (inputs.transport.carKm * 0.1) * 0.18; // 10% reduction
      list.push({
        id: 'trans-drive',
        category: 'transport',
        title: 'Reduce Vehicle Mileage',
        impact: 'High Impact',
        saving: `${reductionPot.toFixed(1)} tons CO2e/year`,
        text: `Your annual driving distance of ${inputs.transport.carKm} km represents a major part of your footprint. Shifting just 10% of these trips to public transport, bicycling, or carpooling could reduce your emissions by about ${reductionPot.toFixed(1)} tons of CO2e.`,
        urgency: 'high'
      });
    }

    if (inputs.transport.carType === 'gasoline' || inputs.transport.carType === 'diesel') {
      const evSaving = (inputs.transport.carKm * (inputs.transport.carType === 'gasoline' ? 0.15 : 0.16)) / 1000;
      list.push({
        id: 'trans-ev',
        category: 'transport',
        title: 'Transition to a Clean Vehicle',
        impact: 'High Impact',
        saving: `${evSaving.toFixed(1)} tons CO2e/year`,
        text: `Switching from a traditional combustion engine to a hybrid or electric vehicle (EV) based on your current driving rate would save approximately ${evSaving.toFixed(1)} tons of CO2e annually.`,
        urgency: 'medium'
      });
    }

    if (inputs.transport.shortFlights + inputs.transport.longFlights > 2) {
      list.push({
        id: 'trans-flights',
        category: 'transport',
        title: 'Offset or Substitute Flights',
        impact: 'Moderate Impact',
        saving: '0.15 - 0.6 tons CO2e/flight',
        text: `With ${inputs.transport.shortFlights + inputs.transport.longFlights} flights per year, aviation is a significant contributor to your climate footprint. Consider substituting non-essential short trips with high-speed rail or video conferencing.`,
        urgency: 'medium'
      });
    }

    // 2. Home energy recommendations
    if (inputs.energy.greenEnergy < 50 && inputs.energy.electricityKwh > 200) {
      const solarSaving = (inputs.energy.electricityKwh * 0.38 * 12) / 1000; // 0.38 is grid factor (0.40) minus green (0.02)
      list.push({
        id: 'energy-green',
        category: 'energy',
        title: 'Opt for a Green Electricity Tariff',
        impact: 'High Impact',
        saving: `${solarSaving.toFixed(1)} tons CO2e/year`,
        text: `Only ${inputs.energy.greenEnergy}% of your electricity is sourced from renewables. Enrolling in a 100% green energy contract with your utility company or installing home solar panels would reduce your home power emissions by ${solarSaving.toFixed(1)} tons of CO2e.`,
        urgency: 'high'
      });
    }

    if (inputs.energy.heatingFuel === 'oil' || inputs.energy.heatingFuel === 'gas') {
      list.push({
        id: 'energy-heat',
        category: 'energy',
        title: 'Insulation & Modern Heating',
        impact: 'Moderate Impact',
        saving: '0.3 - 0.8 tons CO2e/year',
        text: `You use ${inputs.energy.heatingFuel} for heating. Improving your home's wall insulation, sealing window draft leaks, or migrating to an electric heat pump can decrease heating fuel needs by up to 30%.`,
        urgency: 'medium'
      });
    }

    // 3. Food recommendations
    if (inputs.food.dietType === 'meat-heavy' || inputs.food.dietType === 'average') {
      const veganDiff = food - 1.5;
      list.push({
        id: 'food-diet',
        category: 'food',
        title: 'Shift Towards Plant-Based Meals',
        impact: 'High Impact',
        saving: `${veganDiff.toFixed(1)} tons CO2e/year`,
        text: `Reducing your consumption of beef, pork, and dairy products is one of the most effective personal climate choices. Shifting from your current diet profile to a vegan diet would cut your food-related emissions by ${veganDiff.toFixed(1)} tons.`,
        urgency: 'high'
      });
    }

    if (inputs.food.foodWaste === 'high' || inputs.food.foodWaste === 'medium') {
      list.push({
        id: 'food-waste-tip',
        category: 'food',
        title: 'Minimize Food Waste',
        impact: 'Moderate Impact',
        saving: '0.2 - 0.5 tons CO2e/year',
        text: `Throwing away food releases methane in landfills. Planning meals in advance, properly freezing leftovers, and using a compost bin can fully remove food waste emissions.`,
        urgency: 'medium'
      });
    }

    // 4. Shopping recommendations
    if (inputs.shopping.clothes === 'high' || inputs.shopping.electronics === 'high') {
      list.push({
        id: 'shop-habits',
        category: 'shopping',
        title: 'Circular Shopping & Thrifting',
        impact: 'Moderate Impact',
        saving: '0.4 - 0.8 tons CO2e/year',
        text: `High clothing or electronics turnover increases manufacturing and shipping emissions. Try to adopt a 'repair first' rule, rent specialty outfits, and source secondary pre-owned gadgets.`,
        urgency: 'medium'
      });
    }

    if (inputs.shopping.recycle === 'none' || inputs.shopping.recycle === 'some') {
      list.push({
        id: 'shop-recycle',
        category: 'shopping',
        title: 'Optimize Recycling Routines',
        impact: 'Low Impact',
        saving: '0.1 - 0.3 tons CO2e/year',
        text: `You are currently recycling partially or not at all. Implementing strict recycling of plastics, aluminum cans, glass bottles, and paper fibers diverts waste and supports material reuse loops.`,
        urgency: 'low'
      });
    }

    // Default if footprint is already very clean
    if (list.length === 0) {
      list.push({
        id: 'congrats',
        category: 'general',
        title: 'Superb Sustainable Footprint!',
        impact: 'Excellent',
        saving: 'Ongoing',
        text: 'Your current habits place you in a sustainable tier. Maintain your eco-friendly choices and encourage others to calculate their footprint!',
        urgency: 'low'
      });
    }

    return list;
  };

  const insightsList = generateInsights();

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'transport': return 'var(--accent-secondary)'; // Apple Green
      case 'energy': return 'var(--accent-primary)';     // Apple Blue
      case 'food': return 'var(--warning)';              // Apple Orange
      case 'shopping': return 'var(--accent-tertiary)';  // Apple Purple
      default: return 'var(--info)';                     // iOS Light Blue
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h2>Your Personalized Insights</h2>
        <p>Dynamic recommendations computed from your specific inputs to achieve maximum carbon reduction.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
        {insightsList.map((tip) => (
          <div 
            key={tip.id} 
            className="card animate-fade-in"
            style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              alignItems: 'flex-start',
              borderLeft: `5px solid ${getCategoryColor(tip.category)}`,
              padding: '1.5rem'
            }}
          >
            {/* Category indicator icon/badge */}
            <div 
              style={{ 
                fontSize: '2rem', 
                minWidth: '50px', 
                height: '50px', 
                borderRadius: '8px', 
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getCategoryColor(tip.category)
              }}
            >
              {tip.category === 'transport' ? '🚗' : tip.category === 'energy' ? '💡' : tip.category === 'food' ? '🥗' : tip.category === 'shopping' ? '🛍️' : '🌟'}
            </div>

            <div style={{ flex: 1 }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>{tip.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{tip.impact}</span>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Est. Savings: {tip.saving}</span>
                </div>
              </div>
              <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                {tip.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
