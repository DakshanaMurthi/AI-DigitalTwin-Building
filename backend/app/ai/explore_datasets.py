from pathlib import Path
import pandas as pd

# ==========================
# Dataset Paths
# ==========================

BASE_DIR = Path(__file__).resolve().parents[3]

DATASET_DIR = BASE_DIR / "datasets"

OCCUPANCY_DETECTION = DATASET_DIR / "occupancy_detection"
ROOM_OCCUPANCY = DATASET_DIR / "room_occupancy_estimation"
GAS_SENSOR = DATASET_DIR / "gas_sensor"

# ==========================
# Helper
# ==========================

def dataset_summary(df, name):
    print("\n" + "=" * 70)
    print(f"{name}")
    print("=" * 70)

    print("\nShape")
    print(df.shape)

    print("\nColumns")
    print(df.columns.tolist())

    print("\nData Types")
    print(df.dtypes)

    print("\nMissing Values")
    print(df.isnull().sum())

    print("\nFirst Five Rows")
    print(df.head())

    print("\nStatistics")
    print(df.describe(include="all"))


# ======================================================
# Occupancy Detection Dataset
# ======================================================

print("\nLoading Occupancy Detection Dataset...")

train = pd.read_csv(
    OCCUPANCY_DETECTION / "datatraining.txt"
)

test = pd.read_csv(
    OCCUPANCY_DETECTION / "datatest.txt"
)

test2 = pd.read_csv(
    OCCUPANCY_DETECTION / "datatest2.txt"
)

dataset_summary(train, "Occupancy Detection Training")


# ======================================================
# Room Occupancy Estimation Dataset
# ======================================================

print("\nLoading Room Occupancy Estimation Dataset...")

room_df = pd.read_csv(
    ROOM_OCCUPANCY / "Occupancy_Estimation.csv"
)

dataset_summary(
    room_df,
    "Room Occupancy Estimation"
)

# ======================================================
# Gas Sensor Dataset
# ======================================================

print("\nGas Sensor Dataset Files")

for file in sorted(GAS_SENSOR.glob("*")):
    print(file.name)