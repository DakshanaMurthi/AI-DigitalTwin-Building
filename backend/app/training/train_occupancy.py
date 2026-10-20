from pathlib import Path

# pyrefly: ignore [missing-import]
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)


# ============================================================
# PROJECT PATHS
# ============================================================

# __file__:
# AI-DigitalTwin-Building/backend/app/training/train_occupancy.py
#
# parents[0] -> backend/app/training
# parents[1] -> backend/app
# parents[2] -> backend
#
BASE_DIR = Path(__file__).resolve().parents[2]

# Dataset is outside backend:
# AI-DigitalTwin-Building/datasets/Occupancy_Estimation_cleaned.csv
DATASET_PATH = (
    BASE_DIR.parent
    / "datasets"
    / "Occupancy_Estimation_cleaned.csv"
)

# Saved model:
# AI-DigitalTwin-Building/backend/app/ml_models/occupancy_model.pkl
MODEL_DIR = BASE_DIR / "app" / "ml_models"
MODEL_PATH = MODEL_DIR / "occupancy_model.pkl"


# ============================================================
# START
# ============================================================

print("\n" + "=" * 70)
print("AI DIGITAL TWIN - OCCUPANCY MODEL TRAINING")
print("=" * 70)


# ============================================================
# CHECK DATASET
# ============================================================

print("\nDataset path:")
print(DATASET_PATH)

if not DATASET_PATH.exists():
    print("\nERROR: Dataset file was not found.")
    print("\nExpected location:")
    print(DATASET_PATH)

    print("\nPlease make sure your project has this structure:")
    print("""
AI-DigitalTwin-Building/
│
├── backend/
│   └── app/
│       └── training/
│           └── train_occupancy.py
│
└── datasets/
    └── Occupancy_Estimation_cleaned.csv
""")

    raise FileNotFoundError(
        f"Dataset not found: {DATASET_PATH}"
    )


# ============================================================
# LOAD DATASET
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset shape: {df.shape}")


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "S1_Temp",
    "S6_PIR",
    "Occupancy",
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        "\nMissing required dataset columns: "
        + ", ".join(missing_columns)
    )


# ============================================================
# CLEAN DATA
# ============================================================

print("\nChecking missing values...")

print(
    df[required_columns]
    .isnull()
    .sum()
)


df = df.dropna(
    subset=required_columns
).copy()


# ============================================================
# CREATE HARDWARE-MATCHED FEATURES
# ============================================================

"""
ESP32 hardware:

DHT11
    ↓
Temperature

PIR
    ↓
Motion

Dataset mapping:

S1_Temp → Temperature
S6_PIR  → PIR

This gives the ML model exactly two inputs:

Temperature
PIR
"""

df["Temperature"] = pd.to_numeric(
    df["S1_Temp"],
    errors="coerce",
)

df["PIR"] = (
    pd.to_numeric(
        df["S6_PIR"],
        errors="coerce",
    )
    > 0
).astype(int)


# ============================================================
# CLEAN TARGET
# ============================================================

df["Occupancy"] = pd.to_numeric(
    df["Occupancy"],
    errors="coerce",
)

df = df.dropna(
    subset=[
        "Temperature",
        "PIR",
        "Occupancy",
    ]
).copy()

df["Occupancy"] = (
    df["Occupancy"] > 0
).astype(int)


# ============================================================
# FEATURES / TARGET
# ============================================================

FEATURES = [
    "Temperature",
    "PIR",
]

TARGET = "Occupancy"

X = df[FEATURES]
y = df[TARGET]


# ============================================================
# DATASET INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("DATASET INFORMATION")
print("=" * 70)

print(f"Total usable records : {len(df)}")

print("\nFeatures:")
for feature in FEATURES:
    print(f"  - {feature}")

print(f"\nTarget:")
print(f"  - {TARGET}")

print("\nOccupancy distribution:")

occupancy_counts = y.value_counts().sort_index()

for value, count in occupancy_counts.items():

    label = (
        "Vacant"
        if value == 0
        else "Occupied"
    )

    percentage = (
        count / len(y)
    ) * 100

    print(
        f"  {value} ({label}) : "
        f"{count} "
        f"({percentage:.2f}%)"
    )


# ============================================================
# FEATURE INFORMATION
# ============================================================

print("\nTemperature range:")
print(
    f"  Minimum : {X['Temperature'].min():.2f} °C"
)
print(
    f"  Maximum : {X['Temperature'].max():.2f} °C"
)
print(
    f"  Mean    : {X['Temperature'].mean():.2f} °C"
)

print("\nPIR values:")
print(
    sorted(
        X["PIR"].unique()
    )
)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print("\n" + "=" * 70)
print("TRAIN / TEST SPLIT")
print("=" * 70)

print(f"Training samples : {len(X_train)}")
print(f"Testing samples  : {len(X_test)}")


# ============================================================
# DEFINE ML MODELS
# ============================================================

models = {

    "Logistic Regression": Pipeline([
        (
            "scaler",
            StandardScaler(),
        ),
        (
            "model",
            LogisticRegression(
                random_state=42,
                max_iter=1000,
            ),
        ),
    ]),

    "Decision Tree": DecisionTreeClassifier(
        random_state=42,
        max_depth=5,
    ),

    "Random Forest": RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
    ),

    "Gradient Boosting": GradientBoostingClassifier(
        random_state=42,
    ),

    "KNN": Pipeline([
        (
            "scaler",
            StandardScaler(),
        ),
        (
            "model",
            KNeighborsClassifier(
                n_neighbors=5,
            ),
        ),
    ]),

    "SVM": Pipeline([
        (
            "scaler",
            StandardScaler(),
        ),
        (
            "model",
            SVC(
                probability=True,
                random_state=42,
            ),
        ),
    ]),
}


# ============================================================
# TRAIN MODELS
# ============================================================

results = []

print("\n" + "=" * 70)
print("MODEL TRAINING AND EVALUATION")
print("=" * 70)


for name, model in models.items():

    print("\n" + "-" * 70)
    print(f"Training: {name}")
    print("-" * 70)

    model.fit(
        X_train,
        y_train,
    )

    y_pred = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        y_pred,
    )

    precision = precision_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    results.append(
        {
            "Model": name,
            "Accuracy": accuracy,
            "Precision": precision,
            "Recall": recall,
            "F1": f1,
            "Estimator": model,
        }
    )

    print(
        f"Accuracy  : {accuracy * 100:.2f}%"
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
# MODEL COMPARISON
# ============================================================

print("\n" + "=" * 70)
print("MODEL COMPARISON")
print("=" * 70)

results_df = pd.DataFrame(
    [
        {
            "Model": result["Model"],
            "Accuracy (%)": result["Accuracy"] * 100,
            "Precision (%)": result["Precision"] * 100,
            "Recall (%)": result["Recall"] * 100,
            "F1 (%)": result["F1"] * 100,
        }
        for result in results
    ]
)

print(
    results_df.to_string(
        index=False,
        float_format=lambda value: f"{value:.2f}",
    )
)


# ============================================================
# SELECT BEST MODEL
# ============================================================

"""
F1 score is used for model selection because the dataset
contains more vacant samples than occupied samples.

F1 balances:

Precision
+
Recall
"""

best_result = max(
    results,
    key=lambda result: result["F1"],
)

best_model = best_result["Estimator"]
best_model_name = best_result["Model"]


# ============================================================
# CREATE MODEL DIRECTORY
# ============================================================

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# SAVE MODEL PACKAGE
# ============================================================

model_package = {
    "model": best_model,

    "features": FEATURES,

    "target": TARGET,

    "dataset_mapping": {
        "Temperature": "S1_Temp",
        "PIR": "S6_PIR",
    },

    "model_name": best_model_name,
}


joblib.dump(
    model_package,
    MODEL_PATH,
)


# ============================================================
# BEST MODEL INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("BEST MODEL")
print("=" * 70)

print(
    f"Model      : {best_model_name}"
)

print(
    f"Accuracy   : "
    f"{best_result['Accuracy'] * 100:.2f}%"
)

print(
    f"Precision  : "
    f"{best_result['Precision'] * 100:.2f}%"
)

print(
    f"Recall     : "
    f"{best_result['Recall'] * 100:.2f}%"
)

print(
    f"F1 Score   : "
    f"{best_result['F1'] * 100:.2f}%"
)

print("\nModel saved successfully:")

print(MODEL_PATH)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

y_pred_best = best_model.predict(
    X_test
)

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_test,
        y_pred_best,
        target_names=[
            "Vacant",
            "Occupied",
        ],
        zero_division=0,
    )
)


# ============================================================
# SAMPLE PREDICTIONS
# ============================================================

print("\n" + "=" * 70)
print("SAMPLE PREDICTIONS")
print("=" * 70)


samples = pd.DataFrame(
    [
        {
            "Temperature": 29.5,
            "PIR": 1,
        },
        {
            "Temperature": 29.5,
            "PIR": 0,
        },
        {
            "Temperature": 27.0,
            "PIR": 1,
        },
        {
            "Temperature": 27.0,
            "PIR": 0,
        },
    ]
)


sample_predictions = best_model.predict(
    samples
)


if hasattr(
    best_model,
    "predict_proba",
):

    sample_probabilities = (
        best_model.predict_proba(
            samples
        )
    )

else:
    sample_probabilities = None


for index, prediction in enumerate(
    sample_predictions
):

    label = (
        "Occupied"
        if prediction == 1
        else "Vacant"
    )

    print(
        f"\nSample {index + 1}:"
    )

    print(
        f"  Temperature : "
        f"{samples.iloc[index]['Temperature']} °C"
    )

    print(
        f"  PIR         : "
        f"{samples.iloc[index]['PIR']}"
    )

    print(
        f"  Prediction  : {label}"
    )

    if sample_probabilities is not None:

        confidence = (
            sample_probabilities[index].max()
            * 100
        )

        print(
            f"  Confidence  : "
            f"{confidence:.2f}%"
        )


# ============================================================
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("TRAINING COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nHardware-aligned inputs:")
print("  DHT11 Temperature -> Temperature")
print("  PIR Motion        -> PIR")

print("\nSaved model:")
print(MODEL_PATH)

print("\nNext step:")
print("Integrate this model with prediction_service.py")