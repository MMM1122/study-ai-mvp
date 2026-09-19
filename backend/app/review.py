from datetime import datetime, timedelta, timezone
from .models import Flashcard


def schedule(card: Flashcard, rating: str) -> Flashcard:
    now = datetime.now(timezone.utc)
    if rating == "again":
        card.repetitions = 0
        card.interval_days = 0.04  # about 1 hour
        card.ease_factor = max(1.3, card.ease_factor - 0.2)
    elif rating == "hard":
        card.repetitions += 1
        card.interval_days = max(1.0, card.interval_days * 1.2 if card.interval_days else 1.0)
        card.ease_factor = max(1.3, card.ease_factor - 0.15)
    elif rating == "good":
        card.repetitions += 1
        if card.repetitions == 1:
            card.interval_days = 1.0
        elif card.repetitions == 2:
            card.interval_days = 3.0
        else:
            card.interval_days = max(1.0, card.interval_days * card.ease_factor)
    elif rating == "easy":
        card.repetitions += 1
        card.ease_factor = min(3.2, card.ease_factor + 0.15)
        card.interval_days = max(4.0, (card.interval_days or 1.0) * card.ease_factor * 1.3)

    card.last_reviewed_at = now
    card.due_at = now + timedelta(days=card.interval_days)
    return card
