#!/usr/bin/env python3
import asyncio
import json
import websockets
from datetime import datetime

HOST = "localhost"
PORT = 2003
UPDATE_RATE_HZ = 10     # 10 updates per second for smooth motion
STEP = 0.05             # move 0.05° per frame
GNSS_DRIFT = 0.00001

latitude = 28.6139
longitude = 77.2090
altitude = 250.0


async def imu_simulator(websocket):
    global latitude, longitude, altitude
    print(f"🛰️  Connected from {websocket.remote_address}")

    roll = 3.0
    direction = -1
    paused = False

    while True:
        # When paused, just keep sending the same roll value (e.g., 0°)
        if paused:
            msg = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "imu": {"roll": round(roll, 2)},
                "gnss": {
                    "latitude": round(latitude, 6),
                    "longitude": round(longitude, 6),
                    "altitude": round(altitude, 1),
                },
            }
            await websocket.send(json.dumps(msg))
            await asyncio.sleep(1.0 / UPDATE_RATE_HZ)
            continue

        # Update roll value gradually
        roll += STEP * direction

        # When we reach 0°, pause motion
        if abs(roll) <= 0.05:
            roll = 0.0
            paused = True
            print("⏸️  Paused at 0° — waiting for SET command...")

        # GNSS drift (tiny random motion)
        latitude += GNSS_DRIFT * direction
        longitude += GNSS_DRIFT * direction
        altitude += 0.01 * direction

        # Send message
        msg = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "imu": {"roll": round(roll, 2)},
            "gnss": {
                "latitude": round(latitude, 6),
                "longitude": round(longitude, 6),
                "altitude": round(altitude, 1),
            },
        }
        await websocket.send(json.dumps(msg))
        await asyncio.sleep(1.0 / UPDATE_RATE_HZ)


async def main():
    print(f"🚀 Roll Simulator running on ws://{HOST}:{PORT}")
    async with websockets.serve(imu_simulator, HOST, PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
