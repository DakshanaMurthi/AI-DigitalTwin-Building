import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

/*
 * Get all buildings
 */
export const getBuildings = async () => {
    const response = await api.get("/buildings/");
    return response.data?.data ?? response.data ?? [];
};

/*
 * Get one building
 */
export const getBuilding = async (buildingId) => {
    if (!buildingId) {
        throw new Error("Building ID is required");
    }

    const response = await api.get(
        `/buildings/${encodeURIComponent(buildingId)}`
    );

    return response.data?.data ?? response.data;
};

/*
 * Update one building
 */
export const updateBuilding = async (buildingId, buildingData) => {
    if (!buildingId) {
        throw new Error("Building ID is required");
    }

    const response = await api.put(
        `/buildings/${encodeURIComponent(buildingId)}`,
        buildingData
    );

    return response.data?.data ?? response.data;
};

export default api;