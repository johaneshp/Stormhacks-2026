from collections import Counter

from app.models.schemas import CoreMemory, TravelDNA


def compute_travel_dna(categories: list[str]) -> TravelDNA:
    if not categories:
        return TravelDNA()
    counts = Counter(categories)
    total = len(categories)
    return TravelDNA(
        food=round(100 * counts.get("food", 0) / total, 1),
        sightseeing=round(100 * counts.get("sightseeing", 0) / total, 1),
        group_photo=round(100 * counts.get("group_photo", 0) / total, 1),
        selfie=round(100 * counts.get("selfie", 0) / total, 1),
        street_view=round(100 * counts.get("street_view", 0) / total, 1),
    )


def compute_core_memories(checkpoints: list[dict]) -> list[CoreMemory]:
    """checkpoints: [{id, place_name, arrived_at, left_at, photos: [...], category_counts: {...}}]

    Longest food stop, most-photographed stop, and any revisited place become core memories.
    """
    memories: list[CoreMemory] = []

    food_stops = [c for c in checkpoints if c.get("category_counts", {}).get("food", 0) > 0]
    if food_stops:
        longest = max(food_stops, key=lambda c: c["duration_minutes"])
        hours, minutes = divmod(int(longest["duration_minutes"]), 60)
        memories.append(
            CoreMemory(
                title="Longest food stop of the trip",
                checkpoint_id=longest["id"],
                place_name=longest["place_name"],
                date=longest.get("date"),
                detail=(
                    f"You stayed here for {hours}h {minutes}m and took "
                    f"{len(longest['photos'])} photos."
                ),
                photo_url=longest["photos"][0]["file_url"] if longest["photos"] else None,
            )
        )

    if checkpoints:
        most_photographed = max(checkpoints, key=lambda c: len(c["photos"]))
        memories.append(
            CoreMemory(
                title="Most photographed stop",
                checkpoint_id=most_photographed["id"],
                place_name=most_photographed["place_name"],
                date=most_photographed.get("date"),
                detail=f"You took {len(most_photographed['photos'])} photos here.",
                photo_url=most_photographed["photos"][0]["file_url"] if most_photographed["photos"] else None,
            )
        )

    names_seen = Counter(c["place_name"] for c in checkpoints)
    for name, count in names_seen.items():
        if count > 1:
            first = next(c for c in checkpoints if c["place_name"] == name)
            memories.append(
                CoreMemory(
                    title="A place you revisited",
                    checkpoint_id=first["id"],
                    place_name=name,
                    date=first.get("date"),
                    detail=f"You came back to {name} later in the trip.",
                    photo_url=first["photos"][0]["file_url"] if first["photos"] else None,
                )
            )

    return memories
