# Smart Home Dashboard

A full-stack, real-time **Smart Home monitoring dashboard** — codenamed **NestPulse** — built with **Next.js 15**, **Mantine UI v7**, **FastAPI**, **MQTT (Mosquitto)**, and **native WebSockets**.

This project simulates IoT sensor telemetry across multiple rooms (living room, bedroom, kitchen), streams it through a backend event pipeline, and renders live updates in a polished dark-theme dashboard. It supports both HTTP and MQTT transport modes, making it suitable for demonstrations, testing, and as a foundation for real smart-home integrations.

---

## Features

| Feature | Description |
|---|---|
| **Real-time dashboard** | Live-updating sensor cards via WebSocket — no page refresh needed |
| **Multi-room monitoring** | Track temperature, humidity, and motion across living-room, bedroom, and kitchen |
| **Sensor visualisation** | Temperature gauges (with hot/cold gradients), humidity progress bars, motion detection pulses |
| **High-temperature alerts** | Automatic alert banner when any room exceeds 35°C; clears when temperature drops |
| **Room filtering** | Filter the dashboard by room using a segmented control |
| **Live stats bar** | Average temperature, average humidity, motion count, and total update counter |
| **Connection status** | Live / Disconnected badge with pulsing indicator |
| **MQTT broker support** | Full MQTT pipeline via Mosquitto for production-like IoT workflows |
| **HTTP event ingestion** | REST endpoint (`POST /events`) for simpler demos without a broker |
| **Sensor simulators** | Two Python simulators: random continuous readings and a step-by-step demo script |
| **Auto-reconnect** | Frontend WebSocket auto-reconnects on connection loss with exponential backoff |
| **Dark theme UI** | Premium glassmorphism design with gradient accents, glow effects, and smooth animations |
| **Responsive layout** | Adapts seamlessly from mobile to desktop |

---

## Tech Stack

### Backend
- **Python 3.11+** — Runtime
- **FastAPI** — REST & WebSocket server
- **Uvicorn** — ASGI server
- **Pydantic** — Request/response validation
- **paho-mqtt** — MQTT client library
- **Mosquitto** — MQTT message broker (optional)

### Frontend
- **Next.js 15** (App Router) — React framework
- **React 19** — UI library
- **TypeScript** — Type-safe development
- **Mantine UI v7** — Component library & theming
- **CSS** — Custom animations, glassmorphism, responsive design

### Simulator
- **Python 3** — Sensor simulation scripts
- **paho-mqtt** — MQTT publishing
- **urllib** — HTTP event publishing

---

## Architecture

```
┌──────────────────────┐     HTTP / MQTT      ┌──────────────────┐
│   Sensor Simulator   │ ──────────────────▶  │   FastAPI        │
│  (sensor_sim.py /    │                      │   Backend        │
│   event_trigger.py)  │                      │  :8000           │
└──────────────────────┘                      │                  │
                                              │  ┌────────────┐  │
                                              │  │ MQTT Bridge│  │
                                              │  │ (optional)  │  │
                                              │  └────────────┘  │
                                              │                  │
                                              │  ┌────────────┐  │
                                              │  │  WS /ws    │──┼─── WebSocket
                                              │  └────────────┘  │
                                              └──────────────────┘
                                                      │
                                                      │  WebSocket
                                                      ▼
                                              ┌──────────────────┐
                                              │  Next.js 15      │
                                              │  Frontend        │
                                              │  :3000           │
                                              │                  │
                                              │  ┌────────────┐  │
                                              │  │  Dashboard  │  │
                                              │  │  UI         │  │
                                              │  └────────────┘  │
                                              └──────────────────┘
```

### Data Flow

1. **Sensor Simulator** generates fake room readings every 2 seconds (temperature, humidity, motion).
2. Readings are published either via **HTTP POST** to `/events` or **MQTT** topics (`home/{room}/{sensor}`).
3. **FastAPI backend** processes events, updates the in-memory state, and computes high-temperature alerts.
4. On every state change, the backend **broadcasts** the full state over **WebSocket** (`ws://localhost:8000/ws`).
5. **Next.js frontend** connects to the WebSocket, receives state updates, and re-renders the dashboard in real time.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- Mosquitto (optional — for MQTT transport mode)

### 1. Clone & Install

```bash
git clone https://github.com/Shivangi-Sharma06/smart-home-dashboard.git
cd smart-home-dashboard/nestpulse
```

### 2. Backend Setup

```bash
python -m venv .venv
source .venv/bin/activate   # or `.venv\Scripts\activate` on Windows
pip install -r backend/requirements.txt
uvicorn --app-dir backend main:app --reload
```

The backend starts at `http://localhost:8000`.  
Health check: `http://localhost:8000/health`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000`.

### 4. Run the Simulator

From the `nestpulse` directory:

**Random continuous readings (HTTP — recommended for first demo):**
```bash
python simulator/sensor_sim.py
```

**Step-by-step demo sequence (HTTP):**
```bash
python simulator/event_trigger.py --room kitchen
```

This publishes normal readings, motion on/off events, a high-temperature alert, and then a safe temperature — perfect for observing the dashboard update in real time.

**MQTT mode (requires Mosquitto running):**
```bash
# Install & start Mosquitto
brew install mosquitto && brew services start mosquitto   # macOS
sudo apt install mosquitto && sudo systemctl start mosquitto  # Linux

# Run simulator with MQTT
python simulator/event_trigger.py --transport mqtt --room kitchen
python simulator/sensor_sim.py --mqtt
```

---

## Useful Commands

All commands are run from the `nestpulse` directory:

| Command | Description |
|---|---|
| `npm run dev:frontend` | Start Next.js development server |
| `npm run build:frontend` | Build frontend for production |
| `uvicorn --app-dir backend main:app --reload` | Start FastAPI backend with hot-reload |
| `python simulator/sensor_sim.py` | Run random sensor simulator (HTTP) |
| `python simulator/sensor_sim.py --mqtt` | Run sensor simulator (MQTT) |
| `python simulator/event_trigger.py --room kitchen` | Run step-by-step demo (HTTP) |
| `python simulator/event_trigger.py --transport mqtt --room kitchen` | Run step-by-step demo (MQTT) |

---

## Project Structure

```
smart-home-dashboard/
├── README.md
└── nestpulse/
    ├── package.json                    # Root workspace config
    ├── .gitignore
    ├── backend/
    │   ├── main.py                     # FastAPI app — REST & WebSocket endpoints
    │   ├── mqtt_client.py              # MQTT bridge, state management, alert logic
    │   └── requirements.txt            # Python dependencies
    ├── frontend/
    │   ├── package.json                # Next.js dependencies
    │   ├── next.config.ts              # Next.js configuration
    │   ├── tsconfig.json               # TypeScript configuration
    │   └── app/
    │       ├── layout.tsx              # Root layout — MantineProvider, theme, metadata
    │       ├── page.tsx                # Main dashboard page — WebSocket, state, UI
    │       ├── styles.css              # Custom CSS — design tokens, animations, responsive
    │       └── components/
    │           ├── AlertBanner.tsx      # High-temperature alert banner
    │           ├── RoomFilter.tsx       # Room filter segmented control
    │           └── SensorCard.tsx       # Sensor card component (temperature/humidity/motion)
    └── simulator/
        ├── sensor_sim.py               # Random continuous sensor simulator
        └── event_trigger.py            # Step-by-step demo event sequence
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/state` | Get current room state & alerts |
| `POST` | `/events` | Ingest a sensor event |
| `WS` | `/ws` | WebSocket — receive live state updates |

### Example: POST /events

```json
{
  "room": "kitchen",
  "sensor": "temperature",
  "payload": { "value": 38.2, "unit": "C" }
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_WS_URL` | — | Override WebSocket URL (e.g., for production deployments) |
| `MQTT_HOST` | `localhost` | MQTT broker hostname |
| `MQTT_PORT` | `1883` | MQTT broker port |

---

## License

This project is provided for educational and demonstration purposes.