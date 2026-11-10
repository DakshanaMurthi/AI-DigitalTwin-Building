from pathlib import Path

import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


# ============================================================
# PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    BASE_DIR.parent
    / "datasets"
    / "Occupancy_Estimation_cleaned.csv"
)


# ============================================================
# LOAD DATASET
# ============================================================

print("\n" + "=" * 70)
print("PIR-ONLY OCCUPANCY BASELINE EVALUATION")
print("=" * 70)

print("\nDataset:")
print(DATASET_PATH)

df = pd.read_csv(DATASET_PATH)

print(f"\nDataset shape: {df.shape}")


# ============================================================
# CHECK COLUMNS
# ============================================================

required_columns = [
    "S6_PIR",
    "Occupancy",
]

missing = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing:
    raise ValueError(
        "Missing columns: "
        + ", ".join(missing)
    )


# ============================================================
# PREPARE DATA
# ============================================================

df = df.dropna(
    subset=required_columns
).copy()

# PIR:
# 0 -> Vacant
# 1 -> Occupied

df["PIR_Prediction"] = (
    pd.to_numeric(
        df["S6_PIR"],
        errors="coerce",
    )
    > 0
).astype(int)

# Actual occupancy
df["Occupancy"] = (
    pd.to_numeric(
        df["Occupancy"],
        errors="coerce",
    )
    > 0
).astype(int)


y_true = df["Occupancy"]
y_pred = df["PIR_Prediction"]


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(
    y_true,
    y_pred,
)

precision = precision_score(
    y_true,
    y_pred,
    zero_division=0,
)

recall = recall_score(
    y_true,
    y_pred,
    zero_division=0,
)

f1 = f1_score(
    y_true,
    y_pred,
    zero_division=0,
)


# ============================================================
# RESULTS
# ============================================================

print("\n" + "=" * 70)
print("PIR BASELINE RESULTS")
print("=" * 70)

print(
    f"\nAccuracy  : {accuracy * 100:.2f}%"
)

print(
    f"Precision : {precision * 100:.2f}%"
)

print(
    f"Recall    : {recall * 100:.2f}%"
)

print(
    f"F1 Score  : {f1 * 100:.2f}%"
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n" + "=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

cm = confusion_matrix(
    y_true,
    y_pred,
)

print("\n              Predicted")
print("             Vacant  Occupied")
print(
    f"Actual Vacant   {cm[0][0]:5d}   {cm[0][1]:8d}"
)
print(
    f"Actual Occupied {cm[1][0]:5d}   {cm[1][1]:8d}"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_true,
        y_pred,
        target_names=[
            "Vacant",
            "Occupied",
        ],
        zero_division=0,
    )
)


# ============================================================
# PIR / OCCUPANCY RELATIONSHIP
# ============================================================

print("\n" + "=" * 70)
print("PIR / OCCUPANCY RELATIONSHIP")
print("=" * 70)

relationship = pd.crosstab(
    df["S6_PIR"],
    df["Occupancy"],
)

print("\nRows    : PIR")
print("Columns : Occupancy")

print(relationship)


# ============================================================
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("PIR BASELINE EVALUATION COMPLETED")
print("=" * 70)