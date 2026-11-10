import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import manager


router = APIRouter(
    tags=["WebSocket"]
)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    print("\n========================================")
    print("[WebSocket] CONNECTION REQUEST")
    print("========================================")

    await manager.connect(websocket)

    print(
        "[WebSocket] Dashboard client connected successfully"
    )

    try:

        while True:

            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30,
                )

                print(
                    f"[WebSocket] "
                    f"Received from frontend: {message}"
                )

            except asyncio.TimeoutError:

                # Keep the connection alive.
                # The frontend does not need to send
                # anything for the connection to remain active.

                continue

    except WebSocketDisconnect:

        print(
            "[WebSocket] "
            "Dashboard client disconnected"
        )

        manager.disconnect(websocket)

    except Exception as e:

        print(
            f"[WebSocket] "
            f"Unexpected error: {e}"
        )

        manager.disconnect(websocket)