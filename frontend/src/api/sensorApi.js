import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000",
});

export async function getSensorHistory() {
    const response = await API.get("/sensor-data/history?limit=20");
    return response.data;
}

export async function getDashboardRooms() {
    const response = await API.get("/rooms/dashboard");
    return response.data;
}