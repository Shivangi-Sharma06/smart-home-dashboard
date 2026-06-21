import argparse
import json
import random
import time
from urllib.error import URLError
from urllib.request import Request, urlopen

import paho.mqtt.client as mqtt

ROOMS = ("living-room", "bedroom", "kitchen")
BROKER_HOST = "localhost"
BROKER_PORT = 1883
API_URL = "http://localhost:8000/events"


def temperature_reading() -> dict[str, float | str]:
    if random.random() < 0.2:
        value = random.uniform(35.5, 42.0)
    else:
        value = random.uniform(18.0, 34.8)
    return {"value": round(value, 1), "unit": "C"}


def humidity_reading() -> dict[str, float]:
    return {"value": round(random.uniform(30.0, 80.0), 1)}


def motion_reading() -> dict[str, bool]:
    return {"detected": random.choice([True, False])}


def publish_http(api_url: str, room: str, sensor: str, payload: dict[str, float | bool | str]) -> None:
    message = json.dumps({"room": room, "sensor": sensor, "payload": payload}).encode("utf-8")
    request = Request(api_url, data=message, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(request, timeout=5) as response:
        response.read()


def publish_sensor_data(client: mqtt.Client | None, api_url: str) -> None:
    for room in ROOMS:
        readings = {
            "temperature": temperature_reading(),
            "humidity": humidity_reading(),
            "motion": motion_reading(),
        }
        for sensor, payload in readings.items():
            if client is None:
                publish_http(api_url, room, sensor, payload)
                topic = f"http:{room}/{sensor}"
            else:
                topic = f"home/{room}/{sensor}"
                client.publish(topic, json.dumps(payload))
            print(f"{topic}: {payload}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish fake NestPulse sensor readings.")
    parser.add_argument(
        "--transport",
        choices=("http", "mqtt"),
        default="http",
        help="http posts directly to FastAPI; mqtt publishes to the broker.",
    )
    parser.add_argument("--api-url", default=API_URL, help="FastAPI event endpoint for --transport http.")
    parser.add_argument("--broker-host", default=BROKER_HOST, help="MQTT broker host for --transport mqtt.")
    parser.add_argument("--broker-port", type=int, default=BROKER_PORT, help="MQTT broker port for --transport mqtt.")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds between room snapshots.")
    parser.add_argument("--mqtt", action="store_true", help="Shortcut for --transport mqtt.")
    args = parser.parse_args()

    transport = "mqtt" if args.mqtt else args.transport
    client = None
    if transport == "mqtt":
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.connect(args.broker_host, args.broker_port, keepalive=60)
        client.loop_start()
    print(f"NestPulse simulator publishing over {transport} every {args.delay:g} seconds. Press Ctrl+C to stop.")
    try:
        while True:
            publish_sensor_data(client, args.api_url)
            time.sleep(args.delay)
    except KeyboardInterrupt:
        print("\nStopping simulator.")
    except URLError as exc:
        raise SystemExit(f"Could not reach backend at {args.api_url}: {exc}") from exc
    finally:
        if client is not None:
            client.loop_stop()
            client.disconnect()


if __name__ == "__main__":
    main()
