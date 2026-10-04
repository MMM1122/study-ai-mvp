from datetime import datetime, timezone
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from .db import get_db
from .models import ConceptLab, Document
from .lab import generate_concepts
from .config import get_settings
from .llm import GenerationError

router = APIRouter()
logger = logging.getLogger(__name__)

def present(lab, doc):
    return {"document_id": doc.id, "document_title": doc.title,
            "concepts": lab.content["concepts"], "generated_at": lab.generated_at,
            "truncated": lab.truncated}

@router.get("/labs")
def list_labs(db: Session = Depends(get_db)):
    rows = db.execute(select(ConceptLab, Document).join(Document, Document.id == ConceptLab.document_id).order_by(ConceptLab.generated_at.desc())).all()
    return [present(lab, doc) for lab, doc in rows]

@router.get("/documents/{document_id}/lab")
def get_lab(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    lab = db.scalar(select(ConceptLab).where(ConceptLab.document_id == document_id))
    if not lab:
        raise HTTPException(404, "No Concept Lab generated yet")
    return present(lab, doc)

@router.post("/documents/{document_id}/lab")
def create_lab(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if not doc.extracted_text.strip():
        raise HTTPException(422, "No extractable text was found")
    # Reuse the saved lesson. Avoid silent paid regeneration and concurrent overwrite.
    lab = db.scalar(select(ConceptLab).where(ConceptLab.document_id == document_id))
    if lab:
        return present(lab, doc)
    if not get_settings().openrouter_api_key:
        raise HTTPException(503, "Configure OPENROUTER_API_KEY on the backend to generate lessons. Curated labs remain available.")
    try:
        content, truncated = generate_concepts(doc.title, doc.extracted_text)
    except GenerationError as exc:
        raise HTTPException(exc.status_code, str(exc)) from None
    except Exception as exc:
        logger.warning("Concept generation failed: %s", type(exc).__name__)
        raise HTTPException(502, "Lesson generation or source validation failed. Please retry; existing notes are unchanged.") from None
    lab = ConceptLab(document_id=document_id, content=content, truncated=truncated, generated_at=datetime.now(timezone.utc))
    db.add(lab)
    from sqlalchemy.exc import IntegrityError
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        lab = db.scalar(select(ConceptLab).where(ConceptLab.document_id == document_id))
        if lab is None:
            raise HTTPException(409, "Lesson could not be saved; please retry") from None
    db.refresh(lab)
    return present(lab, doc)
