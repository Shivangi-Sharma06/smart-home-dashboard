# NestPulse

Full-stack real-time SmartHome monitoring dashboard with Next.js 15, Mantine v7, FastAPI, Mosquitto MQTT, and native FastAPI WebSockets.

## Run

1. Install and start Mosquitto:

```bash
brew install mosquitto
brew services start mosquitto
```

Or on Debian/Ubuntu:

```bash
sudo apt install mosquitto
sudo systemctl start mosquitto
```

2. Start the backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

3. Start the simulator from the `nestpulse` directory:

```bash
python simulator/sensor_sim.py
```

4. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

You can also install frontend dependencies from the `nestpulse` directory:

```bash
npm install
npm run dev:frontend
```

Open `http://localhost:3000`.

## Data Flow

- `simulator/sensor_sim.py` publishes fake room readings every 2 seconds to `home/{room}/{sensor}`.
- `backend/mqtt_client.py` subscribes to `home/#`, updates an in-memory room state, computes high-temperature alerts, and broadcasts the full state.
- `backend/main.py` serves `ws://localhost:8000/ws`; clients receive current state immediately on connect and every update after that.
- `frontend/app/page.tsx` connects to the WebSocket and renders live room cards, connection status, room filters, and alert banner.
