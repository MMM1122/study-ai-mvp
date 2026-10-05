"""Validate the fields consumed by the original notes and flashcard UI."""
from pydantic import BaseModel, Field
from .lab_schema import Bilingual

class KeyPoint(BaseModel):
    concept: str
    explanation_en: str
    explanation_zh: str
    importance: str
    source_page: int | None = Field(default=None, ge=1)

class Why(BaseModel):
    question_en: str
    answer_en: str
    question_zh: str
    answer_zh: str
    source_page: int | None = Field(default=None, ge=1)

class CornellRow(BaseModel):
    cue_en: str
    cue_zh: str
    notes_en: str
    notes_zh: str
    source_page: int | None = Field(default=None, ge=1)

class Cornell(BaseModel):
    rows: list[CornellRow]
    summary_en: str
    summary_zh: str

class Example(BaseModel):
    title: str
    explanation_en: str
    explanation_zh: str
    code: str | None = None
    source_page: int | None = Field(default=None, ge=1)

class Mistake(BaseModel):
    mistake_en: str
    mistake_zh: str
    fix_en: str
    fix_zh: str
    why_it_happens_en: str | None = None
    why_it_happens_zh: str | None = None
    source_page: int | None = Field(default=None, ge=1)

class Card(BaseModel):
    front: str = Field(min_length=1)
    back: str = Field(min_length=1)
    card_type: str = 'concept'
    source_page: int | None = Field(default=None, ge=1)

class StudyNotes(BaseModel):
    title: str
    summary: Bilingual
    key_points: list[KeyPoint]
    five_whys: list[Why]
    cornell: Cornell
    examples: list[Example]
    common_mistakes: list[Mistake]
    flashcards: list[Card]
    # Retain the richer expert-blind-spot content from the existing prompt.
    concepts: list[dict] = Field(default_factory=list)
