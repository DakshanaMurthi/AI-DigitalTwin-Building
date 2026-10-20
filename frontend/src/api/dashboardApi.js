import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Dashboard overview
export const getDashboardOverview = async () => {
    const response = await api.get("/dashboard/overview");
    return response.data;
};

// Rooms dashboard
export const getDashboardRooms = async () => {
    const response = await api.get("/rooms/dashboard");
    return response.data;
};

// Room prediction
export const getRoomPrediction = async (roomId) => {
    if (!roomId) {
        throw new Error("Room ID is required");
    }

    const response = await api.get(
        `/prediction/${encodeURIComponent(roomId)}`
    );

    return response.data?.data ?? response.data;
};

export default api;