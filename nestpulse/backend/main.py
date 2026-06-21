from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any

from pydantic import BaseModel, Field

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from mqtt_client import ROOMS, SENSORS, MQTTBridge, apply_sensor_event, initial_state


class SensorEvent(BaseModel):
    room: str = Field(examples=["kitchen"])
    sensor: str = Field(examples=["temperature"])
    payload: dict[str, Any] = Field(examples=[{"value": 38.2, "unit": "C"}])


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict[str, Any]) -> None:
        await websocket.send_text(json.dumps(data))

    async def broadcast(self, data: dict[str, Any]) -> None:
        disconnected: list[WebSocket] = []
        message = json.dumps(data)
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except RuntimeError:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


state = initial_state()
manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    bridge = MQTTBridge(state, manager.broadcast)
    app.state.mqtt_bridge = bridge
    try:
        bridge.start()
    except OSError as exc:
        app.state.mqtt_bridge = None
        print(f"MQTT bridge disabled: {exc}")
    try:
        yield
    finally:
        if app.state.mqtt_bridge is not None:
            bridge.stop()


app = FastAPI(title="NestPulse API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/state")
async def current_state() -> dict[str, Any]:
    return state


@app.post("/events")
async def ingest_event(event: SensorEvent) -> dict[str, Any]:
    if event.room not in ROOMS:
        raise HTTPException(status_code=400, detail=f"Unknown room: {event.room}")
    if event.sensor not in SENSORS:
        raise HTTPException(status_code=400, detail=f"Unknown sensor: {event.sensor}")

    try:
        apply_sensor_event(state, event.room, event.sensor, event.payload)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {exc}") from exc

    await manager.broadcast(state)
    return state


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    await manager.send_json(websocket, state)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
