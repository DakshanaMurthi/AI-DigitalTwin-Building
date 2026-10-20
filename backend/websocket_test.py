import asyncio
import websockets


async def listen():

    uri = "ws://127.0.0.1:8000/ws"

    async with websockets.connect(uri) as websocket:

        print("Connected to WebSocket Server")

        while True:

            # heartbeat so server's receive_text() doesn't block forever
            await websocket.send("ping")

            message = await websocket.recv()

            print("\nReceived:")
            print(message)

            await asyncio.sleep(2)


asyncio.run(listen())