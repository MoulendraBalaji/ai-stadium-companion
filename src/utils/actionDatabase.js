/**
 * Action Database for the Carbon Footprint Tracker.
 * Each entry provides an actionable step that reduces carbon emissions.
 * co2SavedKg represents approximate CO2 equivalent saved per log/occurrence.
 */
export const ACTIONS = [
  // TRANSPORT ACTIONS
  {
    id: 'carpool-transit',
    category: 'transport',
    title: 'Use Transit or Carpool',
    description: 'Replace an average driving trip with public transit, walking, cycling, or carpooling.',
    co2SavedKg: 3.2,
    points: 15,
    difficulty: 'easy'
  },
  {
    id: 'bike-walk',
    category: 'transport',
    title: 'Walk or Cycle',
    description: 'For short trips (under 3km), walk or ride a bicycle instead of starting the car.',
    co2SavedKg: 1.8,
    points: 25,
    difficulty: 'easy'
  },
  {
    id: 'eco-driving',
    category: 'transport',
    title: 'Practice Eco-Driving',
    description: 'Drive smoothly, stick to speed limits, and ensure tires are properly inflated to improve fuel economy.',
    co2SavedKg: 0.8,
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'cancel-flight',
    category: 'transport',
    title: 'Replace Flight with Train',
    description: 'Choose a train journey or virtual meeting instead of taking a domestic flight.',
    co2SavedKg: 120.0,
    points: 150,
    difficulty: 'hard'
  },

  // ENERGY ACTIONS
  {
    id: 'thermostat-adjustment',
    category: 'energy',
    title: 'Adjust Thermostat by 1°C',
    description: 'Lower heating by 1°C in winter, or raise cooling by 1°C in summer.',
    co2SavedKg: 1.2,
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'unplug-vampire',
    category: 'energy',
    title: 'Unplug Vampire Electronics',
    description: 'Turn off standby power on electronics (TVs, chargers, computers) when not in use.',
    co2SavedKg: 0.4,
    points: 5,
    difficulty: 'easy'
  },
  {
    id: 'cold-wash-laundry',
    category: 'energy',
    title: 'Wash Laundry in Cold Water',
    description: 'Wash clothes at 30°C or cold instead of 40°C or hot to reduce water-heating energy.',
    co2SavedKg: 0.6,
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'line-dry',
    category: 'energy',
    title: 'Line-Dry Clothes',
    description: 'Skip the electric clothes dryer entirely and hang-dry your laundry.',
    co2SavedKg: 1.5,
    points: 15,
    difficulty: 'medium'
  },
  {
    id: 'led-bulbs',
    category: 'energy',
    title: 'Install LED Lighting',
    description: 'Replace standard incandescent bulbs with highly efficient LEDs.',
    co2SavedKg: 0.2, // daily saving per bulb active
    points: 20,
    difficulty: 'easy'
  },

  // FOOD ACTIONS
  {
    id: 'plant-based-day',
    category: 'food',
    title: 'Eat a Plant-Based Day',
    description: 'Eat entirely plant-based (vegan) meals for a whole day.',
    co2SavedKg: 4.8,
    points: 30,
    difficulty: 'medium'
  },
  {
    id: 'meatless-meal',
    category: 'food',
    title: 'Choose a Meatless Meal',
    description: 'Replace beef, lamb, or pork in a meal with plant proteins (beans, tofu, lentils).',
    co2SavedKg: 2.1,
    points: 15,
    difficulty: 'easy'
  },
  {
    id: 'zero-food-waste',
    category: 'food',
    title: 'Zero Food Waste Day',
    description: 'Plan your meals, eat leftovers, and compost scraps so that no food goes to a landfill.',
    co2SavedKg: 1.5,
    points: 20,
    difficulty: 'medium'
  },
  {
    id: 'eat-local',
    category: 'food',
    title: 'Eat Local & Seasonal',
    description: 'Choose ingredients grown nearby rather than imported goods shipped long distances.',
    co2SavedKg: 0.9,
    points: 10,
    difficulty: 'easy'
  },

  // SHOPPING & CONSUMPTION ACTIONS
  {
    id: 'buy-secondhand',
    category: 'shopping',
    title: 'Buy Secondhand',
    description: 'Buy thrifted clothes or pre-owned items instead of buying brand new manufactured products.',
    co2SavedKg: 8.0,
    points: 25,
    difficulty: 'medium'
  },
  {
    id: 'refuse-single-use',
    category: 'shopping',
    title: 'Refuse Single-Use Plastic',
    description: 'Use reusable grocery bags, water bottles, and coffee cups throughout the day.',
    co2SavedKg: 0.3,
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'repair-item',
    category: 'shopping',
    title: 'Repair Instead of Replace',
    description: 'Mend a torn piece of clothing or repair an electronic gadget instead of purchasing a replacement.',
    co2SavedKg: 25.0,
    points: 40,
    difficulty: 'hard'
  },
  {
    id: 'recycle-audit',
    category: 'shopping',
    title: 'Properly Sort Recycling',
    description: 'Ensure all recyclable cardboards, clean plastics, and metals are properly cleaned and sorted.',
    co2SavedKg: 0.5,
    points: 10,
    difficulty: 'easy'
  }
];
