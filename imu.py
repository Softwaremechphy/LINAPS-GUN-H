#!/usr/bin/env python3
import asyncio
import json
import math
import random
import websockets
from datetime import datetime

# WebSocket server address (must match your React client)
HOST = "localhost"
PORT = 2003

# Simulation parameters
UPDATE_RATE_HZ = 20        # how many updates per second
AMPLITUDE_PITCH = 20       # max pitch swing (+/- degrees)
AMPLITUDE_ROLL = 25        # max roll swing (+/- degrees)
AMPLITUDE_YAW = 180        # yaw wraps around 0–360
NOISE = 2.0                # random jitter
GNSS_DRIFT = 0.00002       # slow GNSS movement per tick

# Starting GNSS position (approx somewhere in India)
latitude = 28.6139
longitude = 77.2090
altitude = 250.0


async def imu_simulator(websocket):
    print(f"🛰️  Client connected from {websocket.remote_address}")
    t = 0.0
    global latitude, longitude, altitude

    while True:
        # Smooth sinusoidal IMU simulation
        pitch = AMPLITUDE_PITCH * math.sin(t)
        roll  = AMPLITUDE_ROLL  * math.sin(t / 1.3)
        yaw   = (AMPLITUDE_YAW + 180 * math.sin(t / 2)) % 360

        # Add small random noise
        pitch += random.uniform(-NOISE, NOISE)
        roll  += random.uniform(-NOISE, NOISE)
        yaw   += random.uniform(-NOISE, NOISE)

        # Simulate slow GNSS drift
        latitude  += random.uniform(-GNSS_DRIFT, GNSS_DRIFT)
        longitude += random.uniform(-GNSS_DRIFT, GNSS_DRIFT)
        altitude  += random.uniform(-0.1, 0.1)

        # Compose JSON packet
        msg = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "imu": {
                "pitch": round(pitch, 2),
                "roll": round(roll, 2),
                "yaw": round(yaw, 2)
            },
            "gnss": {
                "latitude": round(latitude, 6),
                "longitude": round(longitude, 6),
                "altitude": round(altitude, 1)
            }
        }

        await websocket.send(json.dumps(msg))
        await asyncio.sleep(1.0 / UPDATE_RATE_HZ)
        t += 0.05


async def main():
    print(f"🚀 IMU simulator starting on ws://{HOST}:{PORT}")
    async with websockets.serve(imu_simulator, HOST, PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
