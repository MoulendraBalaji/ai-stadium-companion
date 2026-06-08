# CarbonPulse 🌱

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Express](https://img.shields.io/badge/Express-5.0-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ed?logo=docker&logoColor=white)](https://www.docker.com)
[![Vitest](https://img.shields.io/badge/Vitest-4.0-769f39?logo=vitest&logoColor=white)](https://vitest.dev)
[![Accessibility](https://img.shields.io/badge/WCAG-AA%20Compliant-30d158?logo=accessibe&logoColor=white)](#)

CarbonPulse is a high-fidelity, unified carbon footprint calculation, tracking, and simulation dashboard designed for individuals. Built on a pitch-black **Apple HIG** canvas, CarbonPulse integrates a client React SPA with a lightweight **Node.js Express** API server for automated data persistence and offline-resilient LocalStorage fallbacks.

---

## 🎨 Apple Style HIG Design

CarbonPulse adopts Apple's premium dark-mode aesthetic:
- **Cupertino Canvas:** Pitch-black backgrounds (`#000000`) and elevated settings group boxes (`#1c1c1e`).
- **iOS Accent Palette:** Clean highlights using standard Apple Blue (`#0071e3`), Green (`#30d158`), and Purple (`#bf5af2`).
- **Frictionless Control Systems:** Pill-shaped navigation tab-bars and thin range sliders with circular knobs.
- **Glassmorphic Headers:** Sticky navigation headers utilizing frosted-glass backdrop filters.

---

## ✨ Primary Features

1. **Step-by-Step Calculator:** A guided wizard collecting details on transportation, utilities, diet, and consumption habits.
2. **Interactive Metrics Dashboard:** Categorized calculations rendered inside a zero-dependency, responsive SVG donut chart and comparative benchmarks.
3. **Gamified Action Logs:** Log positive daily adjustments (e.g., carpooling, meatless meals) to earn XP points and level up from *Eco Seedling* to *Forest Guardian*.
4. **"What-If" Scenario Simulator:** Range sliders to forecast potential CO2 reductions in real-time.
5. **Personalized Advice Engine:** Tailored recommendations matching your highest emission areas with exact saving metrics.

---

## 🔧 Technical Stack & Parameters

| Criteria | Implementation Details |
| :--- | :--- |
| **Code Quality** | Decoupled pure logic functions in `src/utils/` separate from the UI components. |
| **Security** | Prevents HTML/XSS injection via React property bindings. Minimal dependency footprint. |
| **Efficiency** | Cached outputs, LocalStorage replication, and 100% vector SVG assets instead of heavy chart libraries. |
| **Testing** | 100% formula verification via a Vitest unit test suite. |
| **Accessibility** | Semantic elements, keyboard skip-navigation link, focus indicators, and polite `aria-live` screen reader notifications. |
| **Deployability** | Containerized multi-stage Docker build ready to run on any environment. |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- [Docker](https://www.docker.com) (Optional, for containerized run)

### Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Express API Server (Port 5000):**
   ```bash
   node server.js
   ```

3. **Start the Vite Dev Client (Port 5173):**
   ```bash
   npm run dev
   ```

4. **Access the application:** Open `http://localhost:5173/` in your browser.

---

## 🧪 Testing

The math formulas are fully covered by unit tests. Run the test suite:
```bash
npm run test
```

---

## 🐳 Deploying with Docker

CarbonPulse is configured for easy environment-agnostic deployment. To build and launch both the Node.js Express server and static assets in a unified container on port **8080**:

```bash
docker-compose up --build
```

Access the deployment locally at [http://localhost:8080](http://localhost:8080).
