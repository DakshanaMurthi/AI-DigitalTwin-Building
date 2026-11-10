import math


def calculate_humidity_ratio(
    temperature: float,
    humidity: float,
) -> float:
    """
    Calculate Humidity Ratio from
    Temperature (°C)
    Relative Humidity (%)
    """

    saturation_pressure = (
        6.112
        * math.exp(
            (17.67 * temperature)
            / (temperature + 243.5)
        )
    )

    vapor_pressure = (
        humidity / 100
    ) * saturation_pressure

    humidity_ratio = (
        0.62198
        * vapor_pressure
        / (1013.25 - vapor_pressure)
    )

    return round(humidity_ratio / 1000, 6)