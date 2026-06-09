import { describe, it, expect } from 'vitest';
import {
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateShoppingEmissions,
  calculateCarbonFootprint
} from './carbonCalculations';

describe('Carbon Calculation Formulas', () => {
  
  describe('Transportation Calculations', () => {
    it('returns zero for default or empty values', () => {
      expect(calculateTransportEmissions({})).toBe(0);
    });

    it('handles negative numbers gracefully by clamping to 0', () => {
      expect(calculateTransportEmissions({ carKm: -500, transitKm: -100 })).toBe(0);
    });

    it('correctly calculates emissions for gasoline car and public transit', () => {
      // 10,000 km in gasoline car * 0.18 = 1800 kg
      // 5,000 km transit * 0.04 = 200 kg
      // Total 2000 kg => 2.0 tons
      const result = calculateTransportEmissions({
        carKm: 10000,
        carType: 'gasoline',
        transitKm: 5000,
        shortFlights: 0,
        longFlights: 0
      });
      expect(result).toBeCloseTo(2.0, 4);
    });

    it('calculates flights correctly', () => {
      // 2 short flights (2 * 150 = 300 kg)
      // 1 long flight (1 * 600 = 600 kg)
      // Total 900 kg => 0.9 tons
      const result = calculateTransportEmissions({
        carKm: 0,
        transitKm: 0,
        shortFlights: 2,
        longFlights: 1
      });
      expect(result).toBeCloseTo(0.9, 4);
    });

    it('applies fuel factors correctly', () => {
      const inputs = { carKm: 10000 };
      const gasoline = calculateTransportEmissions({ ...inputs, carType: 'gasoline' });
      const electric = calculateTransportEmissions({ ...inputs, carType: 'electric' });
      const hybrid = calculateTransportEmissions({ ...inputs, carType: 'hybrid' });

      expect(gasoline).toBe(1.8);
      expect(electric).toBe(0.3);
      expect(hybrid).toBe(0.8);
    });
  });

  describe('Home Energy Calculations', () => {
    it('returns zero for zero usage', () => {
      expect(calculateEnergyEmissions({ electricityKwh: 0, heatingAmount: 0 })).toBe(0);
    });

    it('correctly blends green energy percentages', () => {
      // 1000 kWh monthly electricity. 100% grid-backed is 0.4 kg/kWh.
      // Annual electricity = 1000 * 0.4 * 12 = 4800 kg => 4.8 tons
      const fullGrid = calculateEnergyEmissions({
        electricityKwh: 1000,
        greenEnergy: 0,
        heatingAmount: 0,
        householdSize: 1
      });
      expect(fullGrid).toBeCloseTo(4.8, 4);

      // 100% green energy is 0.02 kg/kWh.
      // Annual electricity = 1000 * 0.02 * 12 = 240 kg => 0.24 tons
      const fullGreen = calculateEnergyEmissions({
        electricityKwh: 1000,
        greenEnergy: 100,
        heatingAmount: 0,
        householdSize: 1
      });
      expect(fullGreen).toBeCloseTo(0.24, 4);

      // 50% blend: 0.5 * 0.4 + 0.5 * 0.02 = 0.21 kg/kWh.
      // Annual electricity = 1000 * 0.21 * 12 = 2520 kg => 2.52 tons
      const blend = calculateEnergyEmissions({
        electricityKwh: 1000,
        greenEnergy: 50,
        heatingAmount: 0,
        householdSize: 1
      });
      expect(blend).toBeCloseTo(2.52, 4);
    });

    it('divides emissions accurately across household size', () => {
      const single = calculateEnergyEmissions({
        electricityKwh: 500,
        heatingFuel: 'gas',
        heatingAmount: 500,
        householdSize: 1
      });
      const familyOfFour = calculateEnergyEmissions({
        electricityKwh: 500,
        heatingFuel: 'gas',
        heatingAmount: 500,
        householdSize: 4
      });
      expect(familyOfFour).toBe(single / 4);
    });
  });

  describe('Food Calculations', () => {
    it('computes based on diet type and food waste', () => {
      // Vegan base is 1.5. Low waste is 1.0 multiplier => 1.5 tons
      const veganLow = calculateFoodEmissions({ dietType: 'vegan', foodWaste: 'low' });
      expect(veganLow).toBe(1.5);

      // Meat-heavy is 3.3. High waste is 1.2 multiplier => 3.96 tons
      const meatHeavyHigh = calculateFoodEmissions({ dietType: 'meat-heavy', foodWaste: 'high' });
      expect(meatHeavyHigh).toBeCloseTo(3.96, 4);
    });
  });

  describe('Shopping & Consumption Calculations', () => {
    it('computes based on clothes, electronics, and recycling', () => {
      // Medium clothes (0.6) + Medium electronics (0.4) = 1.0. Recycle some is 0.95 multiplier => 0.95 tons
      const result = calculateShoppingEmissions({
        clothes: 'medium',
        electronics: 'medium',
        recycle: 'some'
      });
      expect(result).toBeCloseTo(0.95, 4);
    });
  });

  describe('Aggregate Footprint Calculator', () => {
    it('aggregates all sectors into a response object', () => {
      const inputs = {
        transport: { carKm: 10000, carType: 'gasoline' }, // 1.8 tons
        energy: { electricityKwh: 500, greenEnergy: 0, heatingAmount: 0, householdSize: 1 }, // 500 * 0.4 * 12 = 2.4 tons
        food: { dietType: 'vegan', foodWaste: 'low' }, // 1.5 tons
        shopping: { clothes: 'low', electronics: 'low', recycle: 'all' } // (0.15 + 0.1) * 0.85 = 0.2125 => 0.21 tons
      };
      
      const report = calculateCarbonFootprint(inputs);
      expect(report.transport).toBe(1.8);
      expect(report.energy).toBe(2.4);
      expect(report.food).toBe(1.5);
      expect(report.shopping).toBe(0.21);
      expect(report.total).toBe(1.8 + 2.4 + 1.5 + 0.21);
    });
  });

  describe('Robustness and Prototype Safety', () => {
    it('handles prototype pollution keys or invalid property lookups gracefully', () => {
      // should fall back to gasoline default (factor 0.18)
      expect(calculateTransportEmissions({ carKm: 10000, carType: 'toString' })).toBeCloseTo(1.8, 4);
      expect(calculateTransportEmissions({ carKm: 10000, carType: '__proto__' })).toBeCloseTo(1.8, 4);

      // should fall back to gas default (factor 0.20)
      expect(calculateEnergyEmissions({ electricityKwh: 0, heatingFuel: 'toString', heatingAmount: 100, householdSize: 1 })).toBeCloseTo(0.24, 4);

      // should fall back to average (2.5) and medium (1.10) defaults
      expect(calculateFoodEmissions({ dietType: 'toString', foodWaste: 'toString' })).toBeCloseTo(2.5 * 1.10, 4);

      // should fall back to medium (0.6, 0.4) and some (0.95) defaults
      expect(calculateShoppingEmissions({ clothes: 'toString', electronics: 'toString', recycle: 'toString' })).toBeCloseTo((0.6 + 0.4) * 0.95, 4);
    });
  });
});

