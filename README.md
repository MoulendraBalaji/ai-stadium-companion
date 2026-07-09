# AI Stadium Companion — FIFA World Cup 2026

An advanced, accessibility-first stadium management and fan assistant application designed for the FIFA World Cup 2026. This system coordinates multi-perspective telemetry, low-emission routing suggestions, real-time Dijkstra pathfinding, and interactive voice-controlled multilingual assistance.

Designed around a dark-canvas console aesthetic, the application provides live telemetry updates and high-contrast accessibility controls for screen-free operations on match day.

---

## 🏛 System Architecture

The project consists of a high-performance Python API backend and a fully responsive React frontend dashboard.

```mermaid
graph TD
    A[React Frontend App] -->|HTTP/SSE| B[FastAPI Gateway]
    B -->|Navigation router| C[Dijkstra Pathfinding Engine]
    B -->|AI router| D[Gemini LLM Integration / Mock]
    C -->|Stadium Map JSON| E[(Stadium Graph Database)]
    B -->|IoT Sensor Stream| F[(Crowd Status Engine)]
```

### ⚡ Technology Stack
*   **Backend:** Python 3.11, FastAPI (Asynchronous Web Framework), Uvicorn (ASGI Web Server), Pydantic v2 (Validation schemas), Pydantic-Settings (Configuration), Google GenAI SDK (Gemini API Integration)
*   **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS 3 (Styling system), Zustand (State management), React Query (Data fetching)
*   **Database/Simulation:** In-memory JSON files simulating IoT stand sensors and turnstile telemetry
*   **Testing:** `pytest` + `pytest-asyncio` (Backend), `vitest` + React Testing Library (Frontend)

---

## 🌟 Core Features

1.  **Dijkstra Wayfinding Navigation**: Calculates optimal routes across a stadium node-edge network. Supports step-free accessibility filter (wheelchair pathing) and automatically adjust edge weights based on real-time zone congestion scores to route users away from overcrowded corridors.
2.  **Multilingual Assistant**: Integrates streaming conversational AI powered by Gemini Flash. Supports automatic language detection with manual overrides for English, Spanish, Portuguese, French, and Arabic.
3.  **Operations Dashboard**: Displays live stand telemetry (occupancy percentages, queue times) and processes sensor telemetry using Gemini to output actionable summaries and response recommendations for staff.
4.  **Web Speech Access**: Native voice-to-text recording (Speech Recognition) and text-to-speech feedback (Speech Synthesis) for hands-free and screen-free operations.
5.  **Inclusive Design**: Complies with WCAG 2.1 AA, featuring tab-index focus states, skip-links, screen reader labels, and high contrast filters.
6.  **Eco-Friendly Transit Suggester**: Provides green route alternatives (electric shuttle, regional metro) alongside estimated CO₂ offsets to lower match-day carbon footprints.

---

## 📂 Project Directory Structure

```
ai-stadium-companion/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI configuration, CORS & Rate Limits
│   │   ├── config.py               # Env var configuration (Pydantic Settings)
│   │   ├── ai_service.py           # Gemini API SDK interface + Mock Mode
│   │   ├── models/
│   │   │   └── schemas.py          # Request/response validation schemas
│   │   ├── routers/
│   │   │   ├── navigation.py       # Wayfinding routes & Dijkstra path calculations
│   │   │   ├── assistant.py        # Streamed chatbot support
│   │   │   ├── crowd.py            # Telemetry status reports
│   │   │   └── ops_dashboard.py    # Operational director reports
│   │   │   └── transit.py          # Low-emission transit recommender
│   │   ├── services/
│   │   │   ├── router_engine.py    # Dijkstra path calculations
│   │   │   ├── crowd_engine.py     # Congestion scaling indices
│   │   │   └── language_service.py # Core language fallback helpers
│   │   └── data/
│   │       ├── stadium_map.json    # Map graph dataset (SIMULATED)
│   │       └── crowd_feed.json     # IoT sensor telemetry feed (SIMULATED)
│   ├── tests/                      # Python pytest files
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example
│   └── pyproject.toml              # Ruff/Black settings
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatAssistant.tsx   # Floating AI Streaming Assistant
    │   │   ├── VoiceInput.tsx      # Web Speech Recognition API controller
    │   │   ├── MapView.tsx         # Interactive SVG Map rendering
    │   │   └── OpsDashboard.tsx    # Live IoT telemetry grid & Actions
    │   ├── lib/api.ts              # Custom typed fetch client & SSE parser
    │   ├── styles/
    │   │   ├── index.css           # Tailwind + imports + custom animations
    │   │   └── a11y.css            # Accessibility focus overrides
    │   ├── App.tsx                 # Core UI Shell layout & Tab controller
    │   └── main.tsx
    │   └── test/                   # Vitest unit tests
    ├── package.json                # JS packages
    ├── tailwind.config.js          # Design color configs
    ├── tsconfig.json               # TS options
    └── vite.config.ts              # Build proxy maps
```

---

## 🛠 Local Setup & Installation

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the development server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`. Swagger documentation is hosted at `http://localhost:8000/docs`.

*Note: If no `GEMINI_API_KEY` is present in your `.env` configuration, `ai_service.py` will automatically switch to **Mock Mode**. It logs a notice on startup and uses local response heuristics (including simulated chunked word streaming) to support end-to-end demonstration.*

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch Vite development server:
    ```bash
    npm run dev
    ```
    Open **`http://localhost:5234`** in your browser to view the application.

---

## 🧪 Running Test Suites

### Backend Unit Tests (pytest)
Tests the Dijkstra algorithm, wheelchair pathing constraints, telemetry adjustments, and endpoint routers:
```bash
cd backend
pytest -v
```

### Frontend Tests (Vitest)
Checks rendering states, interactive tab selections, and Speech mock contexts:
```bash
cd frontend
npm run test
```

---

## 🚀 Production Deployment & Environment Variables

To run the application in production with live Gemini AI capabilities (not Mock Mode) and prevent credentials leakage, you **must not** commit the `.env` file to Git. Instead, set the environment variables directly in the dashboards of Vercel and Railway.

### 1. Backend Service (Railway)
1. In the **Railway** console, create a service pointing to your repository.
2. In settings, set the **Root Directory** to `backend`.
3. In the **Variables** tab, add the following variables:
   * `GEMINI_API_KEY`: `<your_gemini_api_key>` *(your API key, e.g. AQ.Ab8...)*
   * `CORS_ORIGINS`: `*` *(or your Vercel frontend URL, e.g. `https://stadium-companion.vercel.app`)*
   * `ENVIRONMENT`: `production`
4. Deploy the service. Take note of your public domain provided by Railway (e.g. `https://backend-production-xxxx.up.railway.app`).

### 2. Frontend Service (Vercel)
1. In the **Vercel** dashboard, import your repository.
2. Set the **Environment Variables** under project settings:
   * `VITE_API_URL`: `https://backend-production-xxxx.up.railway.app` *(pointing to the Railway URL from Step 1)*
3. Deploy the project. Vercel will automatically read the root `vercel.json`, install node packages, and compile the Vite files cleanly.

