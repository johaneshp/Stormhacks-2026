import numpy as np
from sklearn.cluster import DBSCAN

EARTH_RADIUS_M = 6_371_000


def cluster_into_checkpoints(photos: list[dict], max_distance_m: float = 150.0) -> list[list[dict]]:
    """Groups photos into checkpoints by GPS proximity using DBSCAN with haversine distance.

    `photos` must be pre-sorted by taken_at and each have lat/lon. Photos without
    coordinates are returned as their own single-photo group, in original order.
    """
    located = [p for p in photos if p.get("lat") is not None and p.get("lon") is not None]
    unlocated = [p for p in photos if p.get("lat") is None or p.get("lon") is None]

    if not located:
        return [[p] for p in unlocated]

    coords_rad = np.radians([[p["lat"], p["lon"]] for p in located])
    eps = max_distance_m / EARTH_RADIUS_M

    labels = DBSCAN(eps=eps, min_samples=1, metric="haversine").fit_predict(coords_rad)

    groups: dict[int, list[dict]] = {}
    for label, photo in zip(labels, located):
        groups.setdefault(int(label), []).append(photo)

    ordered_groups = sorted(groups.values(), key=lambda g: min(p["taken_at"] for p in g if p.get("taken_at")))
    ordered_groups.extend([p] for p in unlocated)
    return ordered_groups


def checkpoint_center(photos: list[dict]) -> tuple[float, float]:
    lats = [p["lat"] for p in photos if p.get("lat") is not None]
    lons = [p["lon"] for p in photos if p.get("lon") is not None]
    return sum(lats) / len(lats), sum(lons) / len(lons)
