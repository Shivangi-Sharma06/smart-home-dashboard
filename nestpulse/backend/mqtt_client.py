from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Callable

import paho.mqtt.client as mqtt

ROOMS = ("living-room", "bedroom", "kitchen")
SENSORS = ("temperature", "motion", "humidity")

State = dict[str, Any]
AsyncBroadcaster = Callable[[State], Any]


def initial_state() -> State:
    return {
        "rooms": {
            room: {
                "temperature": None,
                "humidity": None,
                "motion": None,
            }
            for room in ROOMS
        },
        "alerts": [],
    }


class MQTTBridge:
    def __init__(self, state: State, broadcaster: AsyncBroadcaster) -> None:
        self.state = state
        self.broadcaster = broadcaster
        self.loop: asyncio.AbstractEventLoop | None = None
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def start(self, host: str = "localhost", port: int = 1883) -> None:
        self.loop = asyncio.get_running_loop()
        self.client.connect(host, port, keepalive=60)
        self.client.loop_start()

    def stop(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: mqtt.ConnectFlags,
        reason_code: mqtt.ReasonCode,
        properties: mqtt.Properties | None,
    ) -> None:
        if reason_code == 0:
            client.subscribe("home/#")

    def _on_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except json.JSONDecodeError:
            return

        parts = msg.topic.split("/")
        if len(parts) != 3:
            return

        _, room, sensor = parts
        if room not in ROOMS or sensor not in SENSORS:
            return

        self._store_reading(room, sensor, payload)
        self._refresh_alerts()

        if self.loop is not None:
            asyncio.run_coroutine_threadsafe(self.broadcaster(self.state), self.loop)

    def _store_reading(self, room: str, sensor: str, payload: dict[str, Any]) -> None:
        if sensor == "temperature":
            self.state["rooms"][room]["temperature"] = {
                "value": float(payload.get("value", 0)),
                "unit": payload.get("unit", "C"),
            }
        elif sensor == "humidity":
            self.state["rooms"][room]["humidity"] = {
                "value": float(payload.get("value", 0)),
            }
        elif sensor == "motion":
            self.state["rooms"][room]["motion"] = {
                "detected": bool(payload.get("detected", False)),
            }

    def _refresh_alerts(self) -> None:
        alerts = []
        for room, readings in self.state["rooms"].items():
            temperature = readings.get("temperature")
            if temperature and temperature["value"] > 35:
                value = temperature["value"]
                alerts.append(
                    {
                        "room": room,
                        "message": f"High temp: {value:.1f}\u00b0C",
                        "ts": datetime.now(timezone.utc).isoformat(),
                    }
                )
        self.state["alerts"] = alerts
