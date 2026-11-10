import axios from "axios";

const API = "http://127.0.0.1:8000";

export async function getPrediction(roomId) {

    const response = await axios.get(

        `${API}/prediction/${roomId}`

    );

    return response.data;

}

export async function getOccupancyCount(roomId) {

    const response = await axios.get(

        `${API}/occupancy/${roomId}`

    );

    return response.data;

}