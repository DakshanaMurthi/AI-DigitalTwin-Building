import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

export const getSettings = async () => {
    const response = await api.get("/settings");

    return response.data?.data ?? response.data;
};

export const updateSettings = async (settings) => {
    const response = await api.put(
        "/settings",
        settings
    );

    return response.data?.data ?? response.data;
};

export default api;