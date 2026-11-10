let socket = null;
let reconnectTimer = null;

const listeners = new Set();

const WS_URL = "ws://127.0.0.1:8000/ws";

let manuallyDisconnected = false;


// ============================================================
// NOTIFY ALL LISTENERS
// ============================================================

function notifyListeners(message) {

    listeners.forEach((listener) => {

        try {

            listener(message);

        } catch (error) {

            console.error(
                "[WebSocket] Listener error:",
                error
            );

        }

    });

}


// ============================================================
// CREATE PHYSICAL WEBSOCKET CONNECTION
// ============================================================

function createConnection() {

    /*
     * Reuse an existing connection.
     */

    if (
        socket &&
        (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        )
    ) {

        console.log(
            "[WebSocket] Existing connection is active"
        );

        return socket;

    }


    console.log(
        "[WebSocket] Connecting to:",
        WS_URL
    );


    manuallyDisconnected = false;


    socket = new WebSocket(
        WS_URL
    );


    // ========================================================
    // OPEN
    // ========================================================

    socket.onopen = () => {

        console.log(
            "[WebSocket] Connected"
        );


        try {

            if (
                socket &&
                socket.readyState ===
                WebSocket.OPEN
            ) {

                socket.send(
                    "dashboard_connected"
                );

            }

        } catch (error) {

            console.error(
                "[WebSocket] Initial message failed:",
                error
            );

        }

    };


    // ========================================================
    // MESSAGE
    // ========================================================

    socket.onmessage = (event) => {

        try {

            const data =
                JSON.parse(
                    event.data
                );


            console.log(
                "[WebSocket] Message received:",
                data
            );


            notifyListeners(
                data
            );

        } catch (error) {

            console.error(
                "[WebSocket] Invalid message:",
                error
            );

        }

    };


    // ========================================================
    // ERROR
    // ========================================================

    socket.onerror = (error) => {

        console.error(
            "[WebSocket] Error:",
            error
        );

    };


    // ========================================================
    // CLOSE
    // ========================================================

    socket.onclose = () => {

        console.log(
            "[WebSocket] Disconnected"
        );


        socket = null;


        /*
         * Reconnect only if at least one page/component
         * is still listening.
         */

        if (
            !manuallyDisconnected &&
            listeners.size > 0
        ) {

            clearTimeout(
                reconnectTimer
            );


            reconnectTimer =
                setTimeout(
                    () => {

                        console.log(
                            "[WebSocket] Attempting reconnect..."
                        );


                        createConnection();

                    },
                    3000
                );

        }

    };


    return socket;

}


// ============================================================
// CONNECT / SUBSCRIBE
// ============================================================

export function connectWebSocket(
    onMessage
) {

    if (
        typeof onMessage !==
        "function"
    ) {

        console.error(
            "[WebSocket] Invalid listener"
        );

        return null;

    }


    /*
     * Add this component/page as a listener.
     */

    listeners.add(
        onMessage
    );


    manuallyDisconnected =
        false;


    clearTimeout(
        reconnectTimer
    );


    console.log(
        "[WebSocket] Listener added | Total listeners:",
        listeners.size
    );


    /*
     * Create or reuse physical connection.
     */

    return createConnection();

}


// ============================================================
// DISCONNECT ONE LISTENER
// ============================================================

export function disconnectWebSocket(
    onMessage
) {

    if (
        typeof onMessage ===
        "function"
    ) {

        listeners.delete(
            onMessage
        );


        console.log(
            "[WebSocket] Listener removed | Total listeners:",
            listeners.size
        );

    } else {

        console.warn(
            "[WebSocket] disconnectWebSocket called without listener"
        );

    }


    /*
     * Only close the actual WebSocket when
     * no React page/component is using it.
     */

    if (
        listeners.size === 0
    ) {

        console.log(
            "[WebSocket] No active listeners"
        );


        manuallyDisconnected =
            true;


        clearTimeout(
            reconnectTimer
        );


        reconnectTimer =
            null;


        if (socket) {

            try {

                if (
                    socket.readyState ===
                    WebSocket.OPEN ||
                    socket.readyState ===
                    WebSocket.CONNECTING
                ) {

                    socket.close();

                }

            } catch (error) {

                console.error(
                    "[WebSocket] Close error:",
                    error
                );

            }


            socket = null;

        }

    }

}


// ============================================================
// DISCONNECT EVERYTHING
// ============================================================

export function disconnectAllWebSocketListeners() {

    console.log(
        "[WebSocket] Disconnecting all listeners"
    );


    listeners.clear();


    manuallyDisconnected =
        true;


    clearTimeout(
        reconnectTimer
    );


    reconnectTimer =
        null;


    if (socket) {

        try {

            socket.close();

        } catch (error) {

            console.error(
                "[WebSocket] Close error:",
                error
            );

        }


        socket = null;

    }

}