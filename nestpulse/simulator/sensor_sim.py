import json
import random
import time

import paho.mqtt.client as mqtt

ROOMS = ("living-room", "bedroom", "kitchen")
BROKER_HOST = "localhost"
BROKER_PORT = 1883


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


def publish_sensor_data(client: mqtt.Client) -> None:
    for room in ROOMS:
        readings = {
            "temperature": temperature_reading(),
            "humidity": humidity_reading(),
            "motion": motion_reading(),
        }
        for sensor, payload in readings.items():
            topic = f"home/{room}/{sensor}"
            client.publish(topic, json.dumps(payload))
            print(f"{topic}: {payload}")


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)
    client.loop_start()
    print("NestPulse simulator publishing every 2 seconds. Press Ctrl+C to stop.")
    try:
        while True:
            publish_sensor_data(client)
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nStopping simulator.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
