from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .features import FEATURE_ORDER, build_features_from_running_df


MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
MODEL_PATH = os.path.join(MODEL_DIR, "global_performance_gbr.joblib")


def _ensure_dirs() -> None:
    os.makedirs(MODEL_DIR, exist_ok=True)


def _load_synthetic_csvs(data_dir: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load synthetic CSVs if present; otherwise return empty DataFrames."""
    acts_path = os.path.join(data_dir, "synthetic_activities.csv")
    races_path = os.path.join(data_dir, "synthetic_races.csv")
    acts: pd.DataFrame
    races: pd.DataFrame
    if os.path.exists(acts_path):
        acts = pd.read_csv(acts_path)
        if "start_date" in acts.columns:
            acts["start_date"] = pd.to_datetime(acts["start_date"], errors="coerce")
    else:
        acts = pd.DataFrame()
    if os.path.exists(races_path):
        races = pd.read_csv(races_path)
        if "race_date" in races.columns:
            races["race_date"] = pd.to_datetime(races["race_date"], errors="coerce")
    else:
        races = pd.DataFrame()
    return acts, races


def _make_training_rows(activities: pd.DataFrame, races: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    # Guard for empty or missing columns
    if activities is None or activities.empty:
        return np.array([]), np.array([])
    required_cols = {"start_date", "type", "distance", "average_pace", "user_id"}
    if not required_cols.issubset(set(activities.columns)):
        return np.array([]), np.array([])

    X_rows: List[List[float]] = []
    y_rows: List[float] = []

    # Pre-compute running_df per user for efficiency
    activities = activities.sort_values("start_date")
    for (user_id), user_df in activities.groupby("user_id"):
        run_df = user_df[user_df["type"] == "Run"].copy()
        if run_df.empty:
            continue
        # Prepare columns expected by feature builder
        run_df["distance_km"] = run_df["distance"] / 1000.0
        run_df["pace_min_per_km"] = run_df["average_pace"] / 60.0

        # Get each race for this user and build a supervised row based on the preceding 56 days
        if races is None or races.empty or not set(["user_id", "race_date", "race_distance", "race_time_sec"]).issubset(set(races.columns)):
            continue
        user_races = races[races["user_id"] == user_id]
        for _, r in user_races.iterrows():
            ref_time = r["race_date"]
            race_distance_m = float(r["race_distance"])  # m

            # Features from the training window before the race
            fdict = build_features_from_running_df(run_df, reference_time=ref_time, race_distance_m=race_distance_m)
            X_rows.append([fdict[name] for name in FEATURE_ORDER])
            y_rows.append(float(r["race_time_sec"]))

    X = np.array(X_rows, dtype=float)
    y = np.array(y_rows, dtype=float)
    return X, y


def _safe_parse_datetime(s: str) -> datetime | None:
    if pd.isna(s):
        return None
    # Try multiple formats
    for fmt in ("%Y-%m-%d_%H-%M-%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(str(s), fmt)
        except Exception:
            continue
    try:
        return pd.to_datetime(s, errors="coerce").to_pydatetime()
    except Exception:
        return None


def _as_series(val, length):
    if isinstance(val, pd.Series):
        return pd.to_numeric(val, errors="coerce")
    if val is None:
        return pd.Series([np.nan] * length)
    return pd.Series([val] * length)


def _load_kaggle_summaries(kaggle_dir: str) -> pd.DataFrame | None:
    """
    Load Kaggle dataset from s1_summaries.csv and convert to a standard activities dataframe
    compatible with our pipeline. Returns DataFrame with columns:
      [id, user_id, name, type, distance, duration, average_pace, start_date,
       average_heart_rate, elevation_gain, is_race]
    Distance will be in meters, duration in seconds.
    """
    path = os.path.join(kaggle_dir, "s1_summaries.csv")
    if not os.path.exists(path):
        return None

    df = pd.read_csv(path, na_values=["NA", "NaN", "None", ""], low_memory=False)
    # Infer times
    # Prefer timestamp_end_run; fallback to timestamp_stop; else use datetime_ts
    ts_end = df.get("timestamp_end_run") if "timestamp_end_run" in df.columns else None
    end_times = None
    if ts_end is not None:
        end_times = pd.to_datetime(ts_end, unit="s", errors="coerce") if np.issubdtype(ts_end.dtype, np.number) else pd.to_datetime(ts_end, errors="coerce")
    if end_times is None or end_times.isna().all():
        ts_stop = df.get("timestamp_stop") if "timestamp_stop" in df.columns else None
        if ts_stop is not None:
            ser = ts_stop
            parsed = pd.to_datetime(ser, unit="s", errors="coerce") if np.issubdtype(ser.dtype, np.number) else pd.to_datetime(ser, errors="coerce")
            end_times = parsed if end_times is None else end_times.fillna(parsed)
    if end_times is None or end_times.isna().all():
        # Fallback to datetime_ts with explicit format handling
        ts = df.get("datetime_ts")
        if ts is not None:
            parsed_generic = pd.to_datetime(ts, errors="coerce")
            # Where still NaT, try explicit pattern like '2017-09-21_21-17-32'
            needs_manual = parsed_generic.isna()
            if needs_manual.any():
                manual = pd.to_datetime(ts[needs_manual].astype(str), format="%Y-%m-%d_%H-%M-%S", errors="coerce")
                parsed_generic.loc[needs_manual] = manual
            end_times = parsed_generic
    if end_times is None:
        end_times = pd.Series([pd.NaT] * len(df))

    # Duration
    n = len(df)
    duration_sec = _as_series(df.get("total_time_elapsed"), n)
    if duration_sec.isna().all():
        duration_sec = _as_series(df.get("total_time_spent_running"), n)
    if duration_sec.isna().all():
        total_dist = _as_series(df.get("total_dist"), n)
        avg_speed = _as_series(df.get("avg_speed"), n)
        with np.errstate(divide='ignore', invalid='ignore'):
            dur_kmh = total_dist / (avg_speed / 3.6)
            dur_ms = total_dist / avg_speed
        duration_sec = dur_kmh.where((dur_kmh > 600) & (dur_kmh < 18000), other=dur_ms)

    # Distance: prefer total_dist (meters), fallback to total_distance (miles)
    distance_m = _as_series(df.get("total_dist"), n)
    if distance_m.isna().all():
        distance_mi = _as_series(df.get("total_distance"), n)
        distance_m = distance_mi * 1609.34

    # Heart rate average if present
    avg_hr = pd.to_numeric(df.get("heart_rate_mean", pd.Series([np.nan] * len(df))), errors="coerce")

    # Elevation gain not clearly present; approximate from altitude_ascended if available
    elev_gain = pd.to_numeric(df.get("altitude_ascended", pd.Series([0.0] * len(df))), errors="coerce").fillna(0.0)

    # Build activities dataframe
    activities = pd.DataFrame(
        {
            "id": df.get("event_id", pd.Series(range(len(df)))).astype(str),
            "user_id": "kaggle_user_1",
            "name": "Kaggle Run",
            "type": "Run",
            "distance": distance_m,
            "duration": duration_sec,
            "average_pace": (duration_sec / (distance_m / 1000.0)).replace([np.inf, -np.inf], np.nan),
            "start_date": end_times,
            "average_heart_rate": avg_hr,
            "elevation_gain": elev_gain,
            "is_race": True,  # treat as labeled performance for supervision
        }
    )

    # Drop rows with missing essential fields
    activities = activities.dropna(subset=["distance", "duration", "start_date"]).copy()
    # Filter out zero or tiny distances/times
    activities = activities[(activities["distance"] > 1000) & (activities["duration"] > 60)]
    activities = activities.sort_values("start_date").reset_index(drop=True)
    return activities


def _make_training_rows_kaggle(k_acts: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """
    Treat each Kaggle activity as a supervised example: label = duration (sec),
    race_distance = distance. Features are computed using the previous 56 days of runs.
    """
    if k_acts is None or k_acts.empty:
        return np.array([]), np.array([])

    run_df = k_acts.copy()
    run_df = run_df.sort_values("start_date")
    # Prepare required columns
    run_df["distance_km"] = run_df["distance"] / 1000.0
    run_df["pace_min_per_km"] = (run_df["duration"] / 60.0) / run_df["distance_km"].replace(0, np.nan)

    X_rows: List[List[float]] = []
    y_rows: List[float] = []
    for idx, row in run_df.iterrows():
        ref_time = row["start_date"]
        race_distance_m = float(row["distance"])
        fdict = build_features_from_running_df(run_df.iloc[: idx + 1], reference_time=ref_time, race_distance_m=race_distance_m)
        X_rows.append([fdict[name] for name in FEATURE_ORDER])
        y_rows.append(float(row["duration"]))

    X = np.array(X_rows, dtype=float)
    y = np.array(y_rows, dtype=float)
    return X, y


def train_from_directory(data_dir: str, kaggle_dir: str | None = None) -> dict:
    _ensure_dirs()
    activities, races = _load_synthetic_csvs(data_dir)
    X, y = _make_training_rows(activities, races)

    # Optionally augment with Kaggle dataset if present
    if kaggle_dir is None:
        # Try to auto-detect Kaggle data folder at repo root: ../../../data relative to this file
        kaggle_dir_guess = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
        if os.path.exists(os.path.join(kaggle_dir_guess, "s1_summaries.csv")):
            kaggle_dir = kaggle_dir_guess

    if kaggle_dir is not None:
        kaggle_acts = _load_kaggle_summaries(kaggle_dir)
        kX, kY = _make_training_rows_kaggle(kaggle_acts)
        if kX.size > 0:
            X = np.vstack([X, kX]) if X.size > 0 else kX
            y = np.concatenate([y, kY]) if y.size > 0 else kY

    if len(X) == 0:
        raise RuntimeError("No training rows created. Ensure dataset exists and is non-empty.")

    # Clean features (replace NaN/inf)
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    # Optional cap to avoid excessive training time in dev
    max_rows = 50000
    if X.shape[0] > max_rows:
        rng = np.random.default_rng(42)
        idx = rng.choice(X.shape[0], size=max_rows, replace=False)
        X = X[idx]
        y = y[idx]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("gbr", GradientBoostingRegressor(random_state=42)),
        ]
    )

    pipeline.fit(X_train, y_train)
    pred = pipeline.predict(X_val)
    mae = mean_absolute_error(y_val, pred)

    joblib.dump({
        "model": pipeline,
        "feature_order": FEATURE_ORDER,
    }, MODEL_PATH)

    return {
        "trained": True,
        "n_rows": int(len(X)),
        "val_mae_sec": float(mae),
        "model_path": MODEL_PATH,
    }


if __name__ == "__main__":
    default_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    info = train_from_directory(default_data_dir)
    print(info)


