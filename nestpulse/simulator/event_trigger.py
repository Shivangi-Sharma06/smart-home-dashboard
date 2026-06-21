import argparse
import json
import time
from collections.abc import Iterable
from dataclasses import dataclass
from urllib.error import URLError
from urllib.request import Request, urlopen

import paho.mqtt.client as mqtt

BROKER_HOST = "localhost"
BROKER_PORT = 1883
API_URL = "http://localhost:8000/events"
ROOMS = ("living-room", "bedroom", "kitchen")


@dataclass(frozen=True)
class Event:
    room: str
    sensor: str
    payload: dict[str, float | bool | str]
    note: str


def publish_mqtt(client: mqtt.Client, event: Event) -> None:
    topic = f"home/{event.room}/{event.sensor}"
    message = json.dumps(event.payload)
    result = client.publish(topic, message)
    result.wait_for_publish()
    print(f"MQTT publish -> {topic} {message}  # {event.note}")


def publish_http(api_url: str, event: Event) -> None:
    message = json.dumps(
        {
            "room": event.room,
            "sensor": event.sensor,
            "payload": event.payload,
        }
    ).encode("utf-8")
    request = Request(api_url, data=message, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(request, timeout=5) as response:
        response.read()
    print(f"HTTP publish -> {event.room}/{event.sensor} {event.payload}  # {event.note}")


def demo_events(room: str) -> Iterable[Event]:
    yield Event(room, "temperature", {"value": 24.0, "unit": "C"}, "normal temperature")
    yield Event(room, "humidity", {"value": 48.0}, "humidity progress moves")
    yield Event(room, "motion", {"detected": False}, "motion dot is grey")
    yield Event(room, "motion", {"detected": True}, "motion dot pulses green")
    yield Event(room, "temperature", {"value": 38.2, "unit": "C"}, "backend creates high-temp alert")
    yield Event(room, "humidity", {"value": 76.0}, "second humidity update")
    yield Event(room, "temperature", {"value": 27.5, "unit": "C"}, "alert clears when temperature is safe")
    yield Event(room, "motion", {"detected": False}, "motion dot returns to grey")


def all_rooms_snapshot() -> Iterable[Event]:
    values = {
        "living-room": (22.4, 44.0, False),
        "bedroom": (26.1, 52.0, True),
        "kitchen": (39.4, 68.0, True),
    }
    for room, (temperature, humidity, motion) in values.items():
        yield Event(room, "temperature", {"value": temperature, "unit": "C"}, "room temperature")
        yield Event(room, "humidity", {"value": humidity}, "room humidity")
        yield Event(room, "motion", {"detected": motion}, "room motion")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Publish visible NestPulse MQTT demo events for dashboard and WebSocket testing."
    )
    parser.add_argument(
        "--room",
        choices=ROOMS,
        default="kitchen",
        help="Room to use for the step-by-step demo sequence.",
    )
    parser.add_argument(
        "--scenario",
        choices=("demo", "snapshot"),
        default="demo",
        help="demo sends a timed story; snapshot sends one reading for every room.",
    )
    parser.add_argument(
        "--transport",
        choices=("mqtt", "http"),
        default="http",
        help="http posts directly to FastAPI for reliable demos; mqtt exercises the broker path.",
    )
    parser.add_argument("--api-url", default=API_URL, help="FastAPI event endpoint for --transport http.")
    parser.add_argument("--broker-host", default=BROKER_HOST, help="MQTT broker host for --transport mqtt.")
    parser.add_argument("--broker-port", type=int, default=BROKER_PORT, help="MQTT broker port for --transport mqtt.")
    parser.add_argument("--delay", type=float, default=1.5, help="Seconds between MQTT events.")
    args = parser.parse_args()

    events = demo_events(args.room) if args.scenario == "demo" else all_rooms_snapshot()
    print("Publishing NestPulse trigger events. Watch the dashboard and backend WebSocket update.")
    if args.transport == "mqtt":
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.connect(args.broker_host, args.broker_port, keepalive=60)
        client.loop_start()
        try:
            for event in events:
                publish_mqtt(client, event)
                time.sleep(args.delay)
        finally:
            client.loop_stop()
            client.disconnect()
            print("Trigger sequence complete.")
    else:
        try:
            for event in events:
                publish_http(args.api_url, event)
                time.sleep(args.delay)
        except URLError as exc:
            raise SystemExit(f"Could not reach backend at {args.api_url}: {exc}") from exc
        print("Trigger sequence complete.")


if __name__ == "__main__":
    main()
