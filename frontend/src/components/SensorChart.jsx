import React, { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import {
    Paper,
    Box,
    Typography,
} from "@mui/material";

/*
|--------------------------------------------------------------------------
| SensorChart
|--------------------------------------------------------------------------
| Reusable live sensor line chart for:
| - Temperature
| - Humidity
| - Gas Sensor
|
| Expected props:
|
| <SensorChart
|     title="Temperature"
|     data={temperatureData}
|     dataKey="temperature"
|     unit="°C"
| />
|
| <SensorChart
|     title="Humidity"
|     data={humidityData}
|     dataKey="humidity"
|     unit="%"
| />
|
| <SensorChart
|     title="Gas Sensor"
|     data={gasData}
|     dataKey="gas_level"
|     unit=""
| />
|--------------------------------------------------------------------------
*/

const SensorChart = ({
    title = "Sensor",
    data = [],
    dataKey = "value",
    unit = "",
}) => {

    /*
    |--------------------------------------------------------------------------
    | Convert incoming values safely to numbers
    |--------------------------------------------------------------------------
    */

    const chartData = useMemo(() => {
        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .map((item, index) => {
                if (!item) {
                    return null;
                }

                const rawValue = item[dataKey];

                const numericValue =
                    typeof rawValue === "number"
                        ? rawValue
                        : Number.parseFloat(rawValue);

                if (!Number.isFinite(numericValue)) {
                    return null;
                }

                return {
                    ...item,
                    chartValue: numericValue,
                    chartIndex: index,
                };
            })
            .filter(Boolean);
    }, [data, dataKey]);


    /*
    |--------------------------------------------------------------------------
    | Calculate a stable Y-axis domain
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Never use strings, undefined, Infinity, NaN or an invalid range here.
    |
    */

    const yDomain = useMemo(() => {

        if (chartData.length === 0) {
            return [0, 100];
        }

        const values = chartData
            .map((item) => item.chartValue)
            .filter((value) => Number.isFinite(value));

        if (values.length === 0) {
            return [0, 100];
        }

        let minValue = Math.min(...values);
        let maxValue = Math.max(...values);

        /*
        |--------------------------------------------------------------------------
        | Special handling for sensors
        |--------------------------------------------------------------------------
        */

        // Temperature
        if (dataKey === "temperature") {
            minValue = Math.min(minValue, 0);
        }

        // Humidity is naturally bounded from 0 to 100.
        if (dataKey === "humidity") {
            return [0, 100];
        }

        /*
        |--------------------------------------------------------------------------
        | If all readings are identical
        |--------------------------------------------------------------------------
        |
        | Example:
        | temperature = 30.2, 30.2, 30.2
        |
        | A zero-size domain would make the chart unusable.
        |--------------------------------------------------------------------------
        */

        if (minValue === maxValue) {

            let padding;

            if (dataKey === "temperature") {
                padding = 1;
            } else if (dataKey === "gas_level") {
                padding = Math.max(50, Math.abs(minValue) * 0.10);
            } else {
                padding = Math.max(1, Math.abs(minValue) * 0.05);
            }

            return [
                Math.max(0, minValue - padding),
                maxValue + padding,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Normal range
        |--------------------------------------------------------------------------
        */

        const range = maxValue - minValue;

        let padding;

        if (dataKey === "temperature") {
            padding = Math.max(0.5, range * 0.15);
        } else if (dataKey === "gas_level") {
            padding = Math.max(50, range * 0.15);
        } else {
            padding = Math.max(1, range * 0.10);
        }

        let lower = minValue - padding;
        let upper = maxValue + padding;

        /*
        |--------------------------------------------------------------------------
        | Do not show negative gas values
        |--------------------------------------------------------------------------
        */

        if (dataKey === "gas_level") {
            lower = Math.max(0, lower);
        }

        /*
        |--------------------------------------------------------------------------
        | Do not show humidity outside 0-100
        |--------------------------------------------------------------------------
        */

        if (dataKey === "humidity") {
            lower = Math.max(0, lower);
            upper = Math.min(100, upper);
        }

        return [lower, upper];

    }, [chartData, dataKey]);


    /*
    |--------------------------------------------------------------------------
    | Format timestamp
    |--------------------------------------------------------------------------
    */

    const formatTime = (value) => {

        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };


    /*
    |--------------------------------------------------------------------------
    | Tooltip
    |--------------------------------------------------------------------------
    */

    const CustomTooltip = ({ active, payload }) => {

        if (!active || !payload || payload.length === 0) {
            return null;
        }

        const item = payload[0]?.payload;

        if (!item) {
            return null;
        }

        const value = item.chartValue;

        return (
            <Box
                sx={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d9dfe7",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
            >
                <Typography
                    sx={{
                        fontSize: "12px",
                        color: "#667085",
                        marginBottom: "3px",
                    }}
                >
                    {item.timestamp
                        ? formatTime(item.timestamp)
                        : "Live reading"}
                </Typography>

                <Typography
                    sx={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#101828",
                    }}
                >
                    {Number.isFinite(value)
                        ? value.toFixed(2)
                        : "--"}{" "}
                    {unit}
                </Typography>
            </Box>
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Empty state
    |--------------------------------------------------------------------------
    */

    if (chartData.length === 0) {

        return (
            <Paper
                elevation={2}
                sx={{
                    width: "100%",
                    height: 280,
                    borderRadius: 2,
                    padding: 2,
                    boxSizing: "border-box",
                }}
            >

                <Typography
                    sx={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#101828",
                        marginBottom: 1.5,
                    }}
                >
                    {title}
                </Typography>

                <Box
                    sx={{
                        height: 215,
                        width: "100%",
                        border: "1px dashed #cbd5e1",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f8fafc",
                    }}
                >

                    <Typography
                        sx={{
                            color: "#64748b",
                            fontSize: "15px",
                        }}
                    >
                        Waiting for live sensor data...
                    </Typography>

                </Box>

            </Paper>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Main chart
    |--------------------------------------------------------------------------
    */

    return (
        <Paper
            elevation={2}
            sx={{
                width: "100%",
                height: 280,
                borderRadius: 2,
                padding: 2,
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >

            {/* Chart title */}

            <Typography
                sx={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#101828",
                    marginBottom: 1,
                }}
            >
                {title}
            </Typography>


            {/* Chart */}

            <Box
                sx={{
                    width: "100%",
                    height: 225,
                    minWidth: 0,
                }}
            >

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <LineChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 15,
                            left: 5,
                            bottom: 5,
                        }}
                    >

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                        />

                        <XAxis
                            dataKey="chartIndex"
                            tickFormatter={(index) => {

                                const item =
                                    chartData[index];

                                if (
                                    !item ||
                                    !item.timestamp
                                ) {
                                    return "";
                                }

                                return formatTime(
                                    item.timestamp
                                );
                            }}
                            tick={{
                                fontSize: 10,
                                fill: "#64748b",
                            }}
                            tickLine={false}
                            axisLine={{
                                stroke: "#cbd5e1",
                            }}
                            minTickGap={25}
                        />

                        <YAxis
                            domain={yDomain}
                            allowDataOverflow={false}
                            tick={{
                                fontSize: 10,
                                fill: "#64748b",
                            }}
                            tickLine={false}
                            axisLine={{
                                stroke: "#cbd5e1",
                            }}
                            width={45}
                            tickFormatter={(value) => {

                                if (
                                    !Number.isFinite(
                                        Number(value)
                                    )
                                ) {
                                    return "";
                                }

                                if (
                                    dataKey ===
                                    "gas_level"
                                ) {
                                    return Math.round(
                                        Number(value)
                                    ).toString();
                                }

                                return Number(value)
                                    .toFixed(1);
                            }}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                        />

                        <Line
                            type="monotone"
                            dataKey="chartValue"
                            stroke="#1976d2"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 5,
                            }}
                            connectNulls
                            isAnimationActive={false}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </Box>

        </Paper>
    );
};

export default SensorChart;