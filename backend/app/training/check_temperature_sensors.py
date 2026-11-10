from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    BASE_DIR.parent
    / "datasets"
    / "Occupancy_Estimation_cleaned.csv"
)


df = pd.read_csv(DATASET_PATH)

temperature_columns = [
    "S1_Temp",
    "S2_Temp",
    "S3_Temp",
    "S4_Temp",
]

print("\n" + "=" * 70)
print("TEMPERATURE SENSOR ANALYSIS")
print("=" * 70)

for column in temperature_columns:

    print(f"\n{column}")

    print(
        f"  Minimum : {df[column].min():.2f} °C"
    )

    print(
        f"  Maximum : {df[column].max():.2f} °C"
    )

    print(
        f"  Mean    : {df[column].mean():.2f} °C"
    )

    print(
        f"  Median  : {df[column].median():.2f} °C"
    )


print("\n" + "=" * 70)
print("CORRELATION WITH OCCUPANCY")
print("=" * 70)

for column in temperature_columns:

    correlation = df[
        [column, "Occupancy"]
    ].corr().iloc[0, 1]

    print(
        f"{column}: {correlation:.4f}"
    )


print("\n" + "=" * 70)
print("ESP32 REFERENCE")
print("=" * 70)

print("Current ESP32 temperature: approximately 29–30 °C")

print("\nDo NOT train or modify the model yet.")
print("Use the above results to select the most appropriate")
print("temperature representation.")