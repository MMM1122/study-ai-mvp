from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    icon: str = "📚"
    color: str = "indigo"


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)


class FolderOut(ORMModel):
    id: int
    subject_id: int
    name: str
    created_at: datetime


class SubjectOut(ORMModel):
    id: int
    name: str
    description: str | None
    icon: str
    color: str
    created_at: datetime


class SubjectDetail(SubjectOut):
    folders: list[FolderOut] = []


class DocumentOut(ORMModel):
    id: int
    subject_id: int
    folder_id: int | None
    title: str
    filename: str
    mime_type: str | None
    page_count: int | None
    status: str
    created_at: datetime


class DocumentDetail(DocumentOut):
    extracted_text: str


class NoteOut(ORMModel):
    id: int
    document_id: int
    content: dict[str, Any]
    generated_at: datetime


class FlashcardOut(ORMModel):
    id: int
    document_id: int
    front: str
    back: str
    card_type: str
    source_page: int | None
    due_at: datetime
    interval_days: float
    ease_factor: float
    repetitions: int
    last_reviewed_at: datetime | None


class ReviewRequest(BaseModel):
    rating: Literal["again", "hard", "good", "easy"]


class GenerateRequest(BaseModel):
    bilingual: bool = True
    include_flashcards: bool = True
