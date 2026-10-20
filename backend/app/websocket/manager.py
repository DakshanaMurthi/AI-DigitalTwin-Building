from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections for the AI Digital Twin dashboard.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Accept and register a new WebSocket client.
        """

        print("\n========================================")
        print("[WebSocket Manager] New connection request")
        print("========================================")

        await websocket.accept()

        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

        print(
            f"[WebSocket Manager] Client connected | "
            f"Total clients = {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket client.
        """

        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        print(
            f"[WebSocket Manager] Client disconnected | "
            f"Total clients = {len(self.active_connections)}"
        )

    async def send_personal_message(
        self,
        message: dict,
        websocket: WebSocket,
    ):
        """
        Send a message to one WebSocket client.
        """

        try:
            await websocket.send_json(message)

        except Exception as e:
            print(
                f"[WebSocket Manager] "
                f"Personal message failed: {e}"
            )

            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """
        Broadcast a message to all connected dashboard clients.
        """

        client_count = len(self.active_connections)

        print(
            f"[WebSocket Manager] "
            f"Broadcasting to {client_count} client(s)"
        )

        if client_count == 0:
            print(
                "[WebSocket Manager] "
                "WARNING: No active dashboard clients."
            )
            return

        disconnected_clients = []

        for connection in self.active_connections.copy():

            try:
                await connection.send_json(message)

                print(
                    "[WebSocket Manager] "
                    "Message sent successfully"
                )

            except Exception as e:

                print(
                    f"[WebSocket Manager] "
                    f"Send failed: {e}"
                )

                disconnected_clients.append(connection)

        for connection in disconnected_clients:
            self.disconnect(connection)


# ---------------------------------------------------------
# SINGLE GLOBAL CONNECTION MANAGER
# ---------------------------------------------------------

manager = ConnectionManager()