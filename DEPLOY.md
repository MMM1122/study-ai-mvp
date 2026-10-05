# Deploy StudyAI

The easiest production split is:

- **Frontend:** Vercel
- **Backend:** any Docker-friendly host such as Render, Railway, Fly.io, or a VPS
- **Database:** managed PostgreSQL
- **Uploads:** for a real multi-user release, use S3/R2/Supabase Storage instead of container-local storage

The MVP can still run with local/persistent disk storage while you are the only user.

## 1. Select the Concept Lab version

The implementation is in `feat/interactive-concept-lab` in
[MMM1122/study-ai-mvp](https://github.com/MMM1122/study-ai-mvp).
Use that branch for a preview deployment, or merge [PR #1](https://github.com/MMM1122/study-ai-mvp/pull/1)
before deploying the default branch. Do not initialize another Git repository.

`.github/workflows/ci.yml` runs backend and frontend checks on pushes and pull requests.
Do **not** commit `.env` files or your API key.

### Try locally first (no API key needed)

To explore the curated Concept Lab without the backend:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. Curated experiments and browser-local progress work;
Library uploads and generated lessons require the backend.

For the full application, start Docker Desktop, then run from the repository root:

```bash
# Only when .env does not exist; preserve any key already configured.
test -f .env || cp .env.example .env
docker compose up --build
```

The `OPENROUTER_API_KEY=` line can remain blank while you explore curated lessons.
To enable real AI, fill it in the root `.env` and recreate the backend:

```bash
docker compose up -d --force-recreate backend
```

For a non-Docker backend, put the key in `backend/.env` and restart uvicorn instead.
The model is already set to `nvidia/nemotron-3-ultra-550b-a55b:free`.
A configured key is not proof that the provider is reachable; the first successful
generation is the live end-to-end check.

## 2. Create PostgreSQL

Create a managed PostgreSQL database at your backend provider. Copy the connection string. The backend expects a SQLAlchemy/psycopg URL such as:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

If your provider gives `postgresql://...`, keep the same credentials but use `postgresql+psycopg://...` for `DATABASE_URL`.

## 3. Deploy the backend

Create a Docker web service from the GitHub repository and set the service/root directory to `backend`.

Required environment variables:

```env
DATABASE_URL=postgresql+psycopg://...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN.vercel.app
UPLOAD_DIR=/app/data/uploads
```

The container exposes port `8000` and starts:

```text
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

After deploy, verify:

```text
https://YOUR-BACKEND-DOMAIN/health
https://YOUR-BACKEND-DOMAIN/docs
```

For hosts with ephemeral filesystems, uploaded source files disappear after a rebuild unless you attach a persistent disk. Before sharing the product with other users, migrate uploads to object storage.

## 4. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel.

Set:

```text
Root Directory: frontend
Framework Preset: Next.js
```

Environment variable:

```env
NEXT_PUBLIC_API_BASE=https://YOUR-BACKEND-DOMAIN
```

Deploy. Vercel will build the Next.js app and give you a public URL.

## 5. Update backend CORS

Once the Vercel URL is known, make sure your backend has:

```env
CORS_ORIGINS=https://YOUR-REAL-VERCEL-DOMAIN
```

Redeploy the backend if you changed it.

## 6. Production sanity test

From the public site:

1. Open Library and create a subject such as `Cross-disciplinary systems`.
2. Create a `Lectures` folder.
3. Upload `samples/cross_discipline_lab_sample.md`, `samples/cpsc213_cache_sample.md`, or a course PDF.
4. Generate AI notes.
5. Switch UI language between English and Chinese.
6. Switch note language between bilingual, English, and Chinese.
7. Open Review and rate a flashcard.
8. Select **Open / generate Concept Lab** on the document page.
9. Inspect the source quotes, cross-domain mappings and analogy boundaries. Complete a challenge.
10. Refresh and reopen the saved lab; verify notes and flashcards are still present.
11. In `/health`, confirm `provider` is `openrouter`, `model` ends in `:free`, and
    `ai_enabled` is true after a key is configured. No key is returned by this endpoint.

If a free-model request returns 429, wait before retrying. A 503 can mean an absent
key, invalid credentials or temporary provider unavailability; the message identifies
the case. The application does not switch to a paid model. A failed format/source
validation returns 502 and does not save a partial lesson.

## Before inviting other users

The current MVP is intentionally single-user. Before public signup, add:

- authentication
- user IDs on every subject/document/card row
- authorization checks on every API endpoint
- cloud object storage
- background jobs for large PDFs
- rate limits and file-size limits
- malware/file validation
- migrations with Alembic
- privacy policy and data deletion controls

