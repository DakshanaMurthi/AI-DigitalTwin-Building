from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
)
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[3]

DATASET_DIR = (
    BASE_DIR
    / "datasets"
    / "gas_sensor"
)

MODEL_DIR = (
    BASE_DIR
    / "backend"
    / "app"
    / "ml_models"
)

MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "gas_classification_model.pkl"


print("=" * 60)
print("Loading Gas Sensor Dataset")
print("=" * 60)


def load_gas_dataset():

    all_rows = []

    for file_path in sorted(DATASET_DIR.glob("*.dat")):

        print(f"Loading: {file_path.name}")

        with open(file_path, "r") as file:

            for line in file:

                line = line.strip()

                if not line:
                    continue

                parts = line.split()

                first_part = parts[0]

                label, concentration = first_part.split(";")

                features = []

                for item in parts[1:]:

                    _, value = item.split(":")

                    features.append(float(value))

                all_rows.append(
                    [int(label), float(concentration), *features]
                )

    return pd.DataFrame(all_rows)


df = load_gas_dataset()

print("\nDataset shape:", df.shape)

print("\nClass distribution:")
print(df[0].value_counts().sort_index())

print("\nGas concentration range:")
print(df[1].min(), "to", df[1].max())


TARGET = 0

FEATURE_COLUMNS = list(range(2, df.shape[1]))

X = df[FEATURE_COLUMNS]
y = df[TARGET]


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


print("\n" + "=" * 60)
print("Training Random Forest Gas Classifier")
print("=" * 60)


model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)


y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)


print("\nAccuracy")
print(f"{accuracy * 100:.2f}%")


print("\nClassification Report")
print(classification_report(y_test, y_pred))


joblib.dump(model, MODEL_PATH)


print("\nModel Saved Successfully")
print(MODEL_PATH)
