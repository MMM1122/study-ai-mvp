from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


def utcnow():
    return datetime.now(timezone.utc)


class Subject(Base):
    __tablename__ = "subjects"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(16), default="📚")
    color: Mapped[str] = mapped_column(String(32), default="indigo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    folders: Mapped[list[Folder]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    documents: Mapped[list[Document]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class Folder(Base):
    __tablename__ = "folders"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    subject: Mapped[Subject] = relationship(back_populates="folders")
    documents: Mapped[list[Document]] = relationship(back_populates="folder")


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    folder_id: Mapped[int | None] = mapped_column(ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    storage_path: Mapped[str] = mapped_column(Text)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="uploaded")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    subject: Mapped[Subject] = relationship(back_populates="documents")
    folder: Mapped[Folder | None] = relationship(back_populates="documents")
    note: Mapped[StudyNote | None] = relationship(back_populates="document", uselist=False, cascade="all, delete-orphan")
    flashcards: Mapped[list[Flashcard]] = relationship(back_populates="document", cascade="all, delete-orphan")


class StudyNote(Base):
    __tablename__ = "study_notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), unique=True, index=True)
    content: Mapped[dict] = mapped_column(JSON)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    document: Mapped[Document] = relationship(back_populates="note")


class Flashcard(Base):
    __tablename__ = "flashcards"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    card_type: Mapped[str] = mapped_column(String(40), default="concept")
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    interval_days: Mapped[float] = mapped_column(Float, default=0.0)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    document: Mapped[Document] = relationship(back_populates="flashcards")
    reviews: Mapped[list[ReviewLog]] = relationship(back_populates="flashcard", cascade="all, delete-orphan")


class ReviewLog(Base):
    __tablename__ = "review_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    flashcard_id: Mapped[int] = mapped_column(ForeignKey("flashcards.id", ondelete="CASCADE"), index=True)
    rating: Mapped[str] = mapped_column(String(16))
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    flashcard: Mapped[Flashcard] = relationship(back_populates="reviews")
