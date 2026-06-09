/**
 * Carbon Footprint Calculation Utilities
 * Based on IPCC, EPA, and UK DEFRA greenhouse gas conversion factors.
 * All outputs represent metric tons of CO2 equivalent per year (tCO2e/yr).
 */

// EMISSION FACTORS (in kg CO2e per unit)
export const EMISSION_FACTORS = {
  transport: {
    car: {
      gasoline: 0.18, // kg CO2e per km
      diesel: 0.19,    // kg CO2e per km
      hybrid: 0.08,    // kg CO2e per km
      electric: 0.03   // kg CO2e per km (grid-backed average)
    },
    transit: 0.04,     // kg CO2e per km (bus/train average)
    flightShort: 150,  // kg CO2e per flight (<3 hours)
    flightLong: 600    // kg CO2e per flight (>=3 hours)
  },
  energy: {
    electricityGrid: 0.40,  // kg CO2e per kWh
    electricityGreen: 0.02, // kg CO2e per kWh (lifecycle emissions)
    heating: {
      gas: 0.20,       // kg CO2e per kWh
      oil: 0.26,       // kg CO2e per kWh
      electric: 0.40,  // kg CO2e per kWh
      none: 0
    }
  },
  food: {
    diet: {
      'meat-heavy': 3.3, // tons CO2e/year
      'average': 2.5,    // tons CO2e/year
      'low-meat': 1.9,   // tons CO2e/year
      'vegetarian': 1.7, // tons CO2e/year
      'vegan': 1.5       // tons CO2e/year
    },
    wasteMultiplier: {
      high: 1.20,   // +20% emissions due to food waste
      medium: 1.10, // +10% emissions
      low: 1.00     // 0% extra emissions
    }
  },
  shopping: {
    clothes: {
      high: 1.2,    // tons CO2e/year (fast fashion, frequent buying)
      medium: 0.6,  // tons CO2e/year (average buying habits)
      low: 0.15     // tons CO2e/year (thrifted, minimal buying)
    },
    electronics: {
      high: 0.8,    // tons CO2e/year (annual upgrades, high gadget count)
      medium: 0.4,  // tons CO2e/year (average usage)
      low: 0.1      // tons CO2e/year (repair first, rare upgrades)
    },
    recycleMultiplier: {
      none: 1.00,  // 0% reduction
      some: 0.95,  // 5% reduction
      all: 0.85    // 15% reduction in shopping emissions
    }
  }
};

// AVERAGE BENCHMARKS (tons CO2e/year per capita)
export const BENCHMARKS = {
  usAverage: 16.0,
  europeAverage: 6.5,
  globalAverage: 4.5,
  sustainableTarget: 2.0
};

/**
 * Calculates annual transportation emissions.
 */
export function calculateTransportEmissions({
  carKm = 0,
  carType = 'gasoline',
  transitKm = 0,
  shortFlights = 0,
  longFlights = 0
}) {
  const cKm = Math.max(0, Number(carKm) || 0);
  const tKm = Math.max(0, Number(transitKm) || 0);
  const sFlights = Math.max(0, Number(shortFlights) || 0);
  const lFlights = Math.max(0, Number(longFlights) || 0);

  const carFactor = (carType && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.transport.car, carType))
    ? EMISSION_FACTORS.transport.car[carType]
    : EMISSION_FACTORS.transport.car.gasoline;
  const transitFactor = EMISSION_FACTORS.transport.transit;

  const carEmissionsKg = cKm * carFactor;
  const transitEmissionsKg = tKm * transitFactor;
  const shortFlightEmissionsKg = sFlights * EMISSION_FACTORS.transport.flightShort;
  const longFlightEmissionsKg = lFlights * EMISSION_FACTORS.transport.flightLong;

  const totalKg = carEmissionsKg + transitEmissionsKg + shortFlightEmissionsKg + longFlightEmissionsKg;
  return totalKg / 1000; // Convert to metric tons
}

/**
 * Calculates annual home energy emissions.
 */
export function calculateEnergyEmissions({
  electricityKwh = 0, // monthly
  greenEnergy = 0,    // percentage 0-100
  heatingFuel = 'gas',
  heatingAmount = 0,  // monthly kWh
  householdSize = 1
}) {
  const eKwh = Math.max(0, Number(electricityKwh) || 0);
  const gPct = Math.min(100, Math.max(0, Number(greenEnergy) || 0)) / 100;
  const hFuel = (heatingFuel && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.energy.heating, heatingFuel)) ? heatingFuel : 'gas';
  const hAmount = Math.max(0, Number(heatingAmount) || 0);
  const hhSize = Math.max(1, Number(householdSize) || 1);

  // Blend electricity factor based on green contract percentage
  const gridFactor = EMISSION_FACTORS.energy.electricityGrid;
  const greenFactor = EMISSION_FACTORS.energy.electricityGreen;
  const blendedElectricityFactor = (gPct * greenFactor) + ((1 - gPct) * gridFactor);

  // Heating factors
  let heatingFactor = EMISSION_FACTORS.energy.heating[hFuel];
  if (hFuel === 'electric') {
    heatingFactor = blendedElectricityFactor;
  }

  const annualElectricityKg = eKwh * blendedElectricityFactor * 12;
  const annualHeatingKg = hAmount * heatingFactor * 12;

  const totalKg = annualElectricityKg + annualHeatingKg;
  
  // Divide by household members
  return (totalKg / 1000) / hhSize;
}

/**
 * Calculates annual food emissions.
 */
export function calculateFoodEmissions({
  dietType = 'average',
  foodWaste = 'medium'
}) {
  const dietBase = (dietType && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.food.diet, dietType))
    ? EMISSION_FACTORS.food.diet[dietType]
    : EMISSION_FACTORS.food.diet.average;
  const wasteMultiplier = (foodWaste && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.food.wasteMultiplier, foodWaste))
    ? EMISSION_FACTORS.food.wasteMultiplier[foodWaste]
    : EMISSION_FACTORS.food.wasteMultiplier.medium;

  return dietBase * wasteMultiplier;
}

/**
 * Calculates annual shopping/consumption emissions.
 */
export function calculateShoppingEmissions({
  clothes = 'medium',
  electronics = 'medium',
  recycle = 'some'
}) {
  const clothesBase = (clothes && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.shopping.clothes, clothes))
    ? EMISSION_FACTORS.shopping.clothes[clothes]
    : EMISSION_FACTORS.shopping.clothes.medium;
  const electronicsBase = (electronics && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.shopping.electronics, electronics))
    ? EMISSION_FACTORS.shopping.electronics[electronics]
    : EMISSION_FACTORS.shopping.electronics.medium;
  const recycleMultiplier = (recycle && Object.prototype.hasOwnProperty.call(EMISSION_FACTORS.shopping.recycleMultiplier, recycle))
    ? EMISSION_FACTORS.shopping.recycleMultiplier[recycle]
    : EMISSION_FACTORS.shopping.recycleMultiplier.some;

  return (clothesBase + electronicsBase) * recycleMultiplier;
}

/**
 * Calculates the aggregate carbon footprint.
 */
export function calculateCarbonFootprint(inputs) {
  if (!inputs) return { transport: 0, energy: 0, food: 0, shopping: 0, total: 0 };

  const transport = calculateTransportEmissions(inputs.transport || {});
  const energy = calculateEnergyEmissions(inputs.energy || {});
  const food = calculateFoodEmissions(inputs.food || {});
  const shopping = calculateShoppingEmissions(inputs.shopping || {});

  const total = transport + energy + food + shopping;

  return {
    transport: Number(transport.toFixed(2)),
    energy: Number(energy.toFixed(2)),
    food: Number(food.toFixed(2)),
    shopping: Number(shopping.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}
