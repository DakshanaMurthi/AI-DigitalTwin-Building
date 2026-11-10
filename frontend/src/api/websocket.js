let socket = null;

export function connectWebSocket(onMessage) {
    socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socket.onopen = () => {
        console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (error) {
            console.error("Invalid WebSocket message:", error);
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        console.log("WebSocket disconnected");
    };

    return socket;
}

export function disconnectWebSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }
}