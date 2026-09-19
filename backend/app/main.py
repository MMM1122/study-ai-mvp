from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
import shutil
import uuid
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .config import get_settings
from .db import Base, engine, get_db
from .models import Subject, Folder, Document, StudyNote, Flashcard, ReviewLog
from .schemas import SubjectCreate, SubjectOut, SubjectDetail, FolderCreate, FolderOut, DocumentOut, DocumentDetail, NoteOut, FlashcardOut, ReviewRequest, GenerateRequest
from .extract import extract_document, SUPPORTED
from .ai import generate_study_notes
from .review import schedule

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "ai_enabled": bool(settings.openai_api_key), "model": settings.openai_model}


@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    subjects = db.scalar(select(func.count(Subject.id))) or 0
    documents = db.scalar(select(func.count(Document.id))) or 0
    cards = db.scalar(select(func.count(Flashcard.id))) or 0
    now = datetime.now(timezone.utc)
    due = db.scalar(select(func.count(Flashcard.id)).where(Flashcard.due_at <= now)) or 0
    recent = db.scalars(select(Document).order_by(Document.created_at.desc()).limit(6)).all()
    return {"subjects": subjects, "documents": documents, "flashcards": cards, "due": due, "recent_documents": [DocumentOut.model_validate(x) for x in recent]}


@app.get("/subjects", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    return db.scalars(select(Subject).order_by(Subject.created_at.desc())).all()


@app.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Subject).where(func.lower(Subject.name) == payload.name.lower())):
        raise HTTPException(409, "A subject with this name already exists")
    item = Subject(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/subjects/{subject_id}", response_model=SubjectDetail)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    item = db.scalar(select(Subject).options(selectinload(Subject.folders)).where(Subject.id == subject_id))
    if not item: raise HTTPException(404, "Subject not found")
    return item


@app.post("/subjects/{subject_id}/folders", response_model=FolderOut, status_code=201)
def create_folder(subject_id: int, payload: FolderCreate, db: Session = Depends(get_db)):
    if not db.get(Subject, subject_id): raise HTTPException(404, "Subject not found")
    item = Folder(subject_id=subject_id, name=payload.name)
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/subjects/{subject_id}/documents", response_model=list[DocumentOut])
def subject_documents(subject_id: int, folder_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Document).where(Document.subject_id == subject_id)
    if folder_id is not None: stmt = stmt.where(Document.folder_id == folder_id)
    return db.scalars(stmt.order_by(Document.created_at.desc())).all()


@app.post("/documents/upload", response_model=DocumentOut, status_code=201)
def upload_document(
    subject_id: int = Form(...),
    folder_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not db.get(Subject, subject_id): raise HTTPException(404, "Subject not found")
    if folder_id is not None:
        folder = db.get(Folder, folder_id)
        if not folder or folder.subject_id != subject_id: raise HTTPException(400, "Invalid folder")
    original = Path(file.filename or "upload")
    if original.suffix.lower() not in SUPPORTED:
        raise HTTPException(400, f"Supported file types: {', '.join(sorted(SUPPORTED))}")
    safe_name = f"{uuid.uuid4().hex}{original.suffix.lower()}"
    destination = settings.upload_path / safe_name
    with destination.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    try:
        text, page_count = extract_document(destination)
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(422, f"Could not extract file: {exc}")
    item = Document(
        subject_id=subject_id, folder_id=folder_id, title=original.stem,
        filename=original.name, mime_type=file.content_type, storage_path=str(destination),
        extracted_text=text, page_count=page_count, status="extracted"
    )
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/documents/{document_id}", response_model=DocumentDetail)
def get_document(document_id: int, db: Session = Depends(get_db)):
    item = db.get(Document, document_id)
    if not item: raise HTTPException(404, "Document not found")
    return item


@app.post("/documents/{document_id}/generate", response_model=NoteOut)
def generate_document_notes(document_id: int, payload: GenerateRequest, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc: raise HTTPException(404, "Document not found")
    if not doc.extracted_text.strip(): raise HTTPException(422, "No extractable text was found")
    doc.status = "processing"; db.commit()
    try:
        content = generate_study_notes(doc.title, doc.extracted_text, payload.bilingual)
        note = db.scalar(select(StudyNote).where(StudyNote.document_id == document_id))
        if note: note.content = content
        else:
            note = StudyNote(document_id=document_id, content=content)
            db.add(note)
        db.query(Flashcard).filter(Flashcard.document_id == document_id).delete()
        if payload.include_flashcards:
            for item in content.get("flashcards", [])[:80]:
                if item.get("front") and item.get("back"):
                    db.add(Flashcard(
                        document_id=document_id,
                        front=item["front"], back=item["back"],
                        card_type=item.get("card_type", "concept"), source_page=item.get("source_page")
                    ))
        doc.status = "ready"
        db.commit(); db.refresh(note)
        return note
    except Exception as exc:
        doc.status = "error"; db.commit()
        raise HTTPException(500, f"AI generation failed: {exc}")


@app.get("/documents/{document_id}/note", response_model=NoteOut)
def get_note(document_id: int, db: Session = Depends(get_db)):
    note = db.scalar(select(StudyNote).where(StudyNote.document_id == document_id))
    if not note: raise HTTPException(404, "Notes have not been generated yet")
    return note


@app.get("/documents/{document_id}/flashcards", response_model=list[FlashcardOut])
def document_flashcards(document_id: int, db: Session = Depends(get_db)):
    return db.scalars(select(Flashcard).where(Flashcard.document_id == document_id).order_by(Flashcard.id)).all()


@app.get("/review/due", response_model=list[FlashcardOut])
def due_flashcards(limit: int = 30, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    return db.scalars(select(Flashcard).where(Flashcard.due_at <= now).order_by(Flashcard.due_at).limit(min(limit, 100))).all()


@app.post("/flashcards/{flashcard_id}/review", response_model=FlashcardOut)
def review_flashcard(flashcard_id: int, payload: ReviewRequest, db: Session = Depends(get_db)):
    card = db.get(Flashcard, flashcard_id)
    if not card: raise HTTPException(404, "Flashcard not found")
    schedule(card, payload.rating)
    db.add(ReviewLog(flashcard_id=flashcard_id, rating=payload.rating))
    db.commit(); db.refresh(card)
    return card
