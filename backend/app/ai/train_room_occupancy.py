import os
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

# --------------------------------------------------
# Dataset Path
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "room_occupancy_estimation",
    "Occupancy_Estimation.csv",
)

MODEL_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "ml_models",
)

os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "room_occupancy_model.pkl",
)

print("=" * 60)
print("Loading Room Occupancy Dataset")
print("=" * 60)

df = pd.read_csv(DATASET_PATH)

print(df.head())

# --------------------------------------------------
# Features
# --------------------------------------------------

FEATURES = [
    "S1_Temp",
    "S2_Temp",
    "S3_Temp",
    "S4_Temp",
    "S5_CO2",
    "S6_PIR",
    "S7_PIR",
]

X = df[FEATURES]

y = df["Room_Occupancy_Count"]

# --------------------------------------------------
# Train/Test Split
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)

# --------------------------------------------------
# Train Model
# --------------------------------------------------

print("\nTraining Random Forest...\n")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
)

model.fit(X_train, y_train)

# --------------------------------------------------
# Evaluation
# --------------------------------------------------

pred = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    pred,
)

print(f"Accuracy : {accuracy*100:.2f}%")

print("\nClassification Report\n")

print(
    classification_report(
        y_test,
        pred,
    )
)

# --------------------------------------------------
# Save Model
# --------------------------------------------------

joblib.dump(
    model,
    MODEL_PATH,
)

print("\nModel Saved Successfully")

print(MODEL_PATH)