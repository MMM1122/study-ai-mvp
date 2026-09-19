# StudyAI MVP

A bilingual AI study workspace for course materials. Organize subjects and folders, upload course files, generate structured study notes, turn those notes into flashcards, and review with spaced repetition.

## What is included

- Subject and folder organization
- Upload: PDF, DOCX, PPTX, TXT, Markdown
- Text extraction with PDF/slide page markers
- English / Chinese interface toggle
- AI-generated bilingual (English + Chinese) study notes
  - Summary
  - Key points
  - 5 Why explanations
  - Cornell notes
  - Examples / code examples
  - Common mistakes
  - Source page hints when supported by the uploaded material
- Auto-generated flashcards
- Review queue with Again / Hard / Good / Easy scheduling
- Responsive Next.js interface
- PostgreSQL in Docker; SQLite fallback for backend-only local testing
- Demo mode when no OpenAI API key is configured

## Architecture

```text
Next.js 16 / React 19
        |
        v
FastAPI / SQLAlchemy
        |
        +---- OpenAI Responses API
        |
        +---- PostgreSQL
        |
        +---- local/object-like upload storage
```

## Fastest start: Docker

Requirements: Docker Desktop.

```bash
cp .env.example .env
# Put your API key in .env if you want real AI generation.
docker compose up --build
```

Open:

- Web app: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Without an API key, uploads and the product flow still work, but note generation uses demo output so you can test the UI.

## Local development without Docker

### Backend

Use Python 3.12+.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

For the simplest local backend test, change `DATABASE_URL` in `backend/.env` to:

```env
DATABASE_URL=sqlite:///./studyai.db
```

Then:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

Next.js currently requires Node.js 20.9+; Node 22 is a good default.

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## First test flow

1. Create a subject such as `CPSC 213` or `PSYC 101`.
2. Create an optional folder such as `Lectures`.
3. Upload a PDF, PPTX, DOCX, TXT, or MD file.
4. Open the document and select **Generate AI notes**.
5. Switch between bilingual, English, and Chinese display.
6. Open **Review** and practice the generated flashcards.

## Important implementation notes

### Grounding and page references
PDF and PPTX extraction inserts explicit page markers before sending course material to the model. The prompt instructs the model to add `source_page` only when the source supports it. This is a helpful study citation, but it should still be treated as an AI-generated reference and checked against the original course file for high-stakes studying.

### Cost control
The MVP caps the amount of source text sent in a single generation (`MAX_AI_CHARS`). A production V2 should replace this with hierarchical section summarization and retrieval over chunks so large textbooks do not need to be sent repeatedly.

### Review scheduling
The review scheduler is intentionally simple and understandable. It uses four ratings and increasing intervals. A later version can move to FSRS for a more optimized spaced-repetition schedule.

## Next production milestones

1. Authentication and per-user data isolation
2. Cloud object storage (S3 / R2 / Supabase Storage)
3. Chunking + embeddings + retrieval for “Ask my notes”
4. Hierarchical summarization for long textbooks
5. Quiz / practice exam generation
6. Weak-topic analytics and study calendar
7. Knowledge graph across lectures
8. Streaming AI generation and job queue
9. Real source viewer with click-to-jump PDF pages
10. Deployment: frontend on Vercel; API/database on Render, Railway, Fly.io, or similar

## GitHub and deployment

A GitHub Actions workflow is included at `.github/workflows/ci.yml`. Full deployment steps are in `DEPLOY.md`.

## Project layout

```text
study-ai-mvp/
├── backend/
│   ├── app/
│   │   ├── ai.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── extract.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── review.py
│   │   └── schemas.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Verification performed

The backend has a smoke test that exercises subject creation, folder creation, upload/extraction, note generation in demo mode, flashcard creation, review scheduling, and dashboard statistics. Run:

```bash
python scripts/smoke_test.py
```

The repository was also checked for Python syntax and frontend TSX syntax. A full Next.js dependency build still requires `npm install` on a networked development machine.
