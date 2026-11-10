import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

function TemperatureChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="time" />

                <YAxis unit="°C" />

                <Tooltip />

                <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#1976d2"
                    strokeWidth={3}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default TemperatureChart;