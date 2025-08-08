from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List

import numpy as np
import pandas as pd


FEATURE_ORDER: List[str] = [
    "race_distance_km",
    "total_distance_km_7d",
    "total_distance_km_14d",
    "total_distance_km_28d",
    "runs_count_28d",
    "longest_run_km_28d",
    "avg_pace_min_per_km_28d",
    "avg_hr_28d",
    "elevation_gain_m_28d",
    "acwr",
    "days_since_last_run",
]


def _sum_in_window(df: pd.DataFrame, end: datetime, days: int, col: str) -> float:
    start = end - timedelta(days=days)
    window = df[(df["start_date"] >= start) & (df["start_date"] < end)]
    if window.empty or col not in window.columns:
        return 0.0
    return float(window[col].sum())


def _mean_in_window(df: pd.DataFrame, end: datetime, days: int, col: str) -> float:
    start = end - timedelta(days=days)
    window = df[(df["start_date"] >= start) & (df["start_date"] < end)]
    if window.empty or col not in window.columns:
        return 0.0
    return float(window[col].mean())


def _max_in_window(df: pd.DataFrame, end: datetime, days: int, col: str) -> float:
    start = end - timedelta(days=days)
    window = df[(df["start_date"] >= start) & (df["start_date"] < end)]
    if window.empty or col not in window.columns:
        return 0.0
    return float(window[col].max())


def build_features_from_running_df(
    running_df: pd.DataFrame, reference_time: datetime, race_distance_m: float
) -> Dict[str, float]:
    """
    Build a compact, robust feature vector from running_df for inference/training.
    Assumes running_df contains at least columns: start_date, distance_km, pace_min_per_km,
    average_heart_rate (optional), elevation_gain (optional).
    """
    if running_df.empty:
        # return zeros with distance filled
        return {name: 0.0 for name in FEATURE_ORDER} | {
            "race_distance_km": race_distance_m / 1000.0
        }

    df = running_df.copy()
    # Ensure expected columns exist
    if "distance_km" not in df.columns and "distance" in df.columns:
        df["distance_km"] = df["distance"] / 1000.0
    if "pace_min_per_km" not in df.columns and "average_pace" in df.columns:
        df["pace_min_per_km"] = df["average_pace"] / 60.0
    if "elevation_gain" not in df.columns:
        df["elevation_gain"] = 0.0

    # Ensure timezone-naive datetimes
    df["start_date"] = pd.to_datetime(df["start_date"], utc=False)
    if hasattr(df["start_date"].dt, 'tz') and df["start_date"].dt.tz is not None:
        df["start_date"] = df["start_date"].dt.tz_localize(None)
    df = df.sort_values("start_date")

    total_distance_km_7d = _sum_in_window(df, reference_time, 7, "distance_km")
    total_distance_km_14d = _sum_in_window(df, reference_time, 14, "distance_km")
    total_distance_km_28d = _sum_in_window(df, reference_time, 28, "distance_km")
    runs_count_28d = int(
        len(df[(df["start_date"] >= reference_time - pd.Timedelta(days=28)) & (df["start_date"] < reference_time)])
    )
    longest_run_km_28d = _max_in_window(df, reference_time, 28, "distance_km")
    avg_pace_min_per_km_28d = _mean_in_window(df, reference_time, 28, "pace_min_per_km")
    avg_hr_28d = _mean_in_window(df, reference_time, 28, "average_heart_rate")
    elevation_gain_m_28d = _sum_in_window(df, reference_time, 28, "elevation_gain")

    # Acute:Chronic Workload Ratio (ACWR)
    acute = total_distance_km_7d
    chronic = total_distance_km_28d / 4.0 if total_distance_km_28d > 0 else 0.0
    acwr = float(acute / chronic) if chronic > 0 else 0.0

    # Days since last run
    last_run_date = df["start_date"].max()
    days_since_last_run = float((reference_time - last_run_date).days)

    features = {
        "race_distance_km": race_distance_m / 1000.0,
        "total_distance_km_7d": total_distance_km_7d,
        "total_distance_km_14d": total_distance_km_14d,
        "total_distance_km_28d": total_distance_km_28d,
        "runs_count_28d": float(runs_count_28d),
        "longest_run_km_28d": longest_run_km_28d,
        "avg_pace_min_per_km_28d": avg_pace_min_per_km_28d if not np.isnan(avg_pace_min_per_km_28d) else 0.0,
        "avg_hr_28d": avg_hr_28d if not np.isnan(avg_hr_28d) else 0.0,
        "elevation_gain_m_28d": elevation_gain_m_28d,
        "acwr": acwr,
        "days_since_last_run": days_since_last_run,
    }

    # Ensure order and types
    return {name: float(features.get(name, 0.0)) for name in FEATURE_ORDER}


