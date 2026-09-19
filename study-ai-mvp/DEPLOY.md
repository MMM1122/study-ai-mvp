# Deploy StudyAI

The easiest production split is:

- **Frontend:** Vercel
- **Backend:** any Docker-friendly host such as Render, Railway, Fly.io, or a VPS
- **Database:** managed PostgreSQL
- **Uploads:** for a real multi-user release, use S3/R2/Supabase Storage instead of container-local storage

The MVP can still run with local/persistent disk storage while you are the only user.

## 1. Upload the repository to GitHub

Create a new empty GitHub repository and upload/push this project. After the first push, `.github/workflows/ci.yml` automatically runs backend and frontend checks.

Typical terminal flow:

```bash
git init
git add .
git commit -m "Initial StudyAI MVP"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Do **not** commit `.env` files or your API key.

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
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
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

1. Create `CPSC 213`.
2. Create a `Lectures` folder.
3. Upload `samples/cpsc213_cache_sample.md` or one of your own PDFs.
4. Generate AI notes.
5. Switch UI language between English and Chinese.
6. Switch note language between bilingual, English, and Chinese.
7. Open Review and rate a flashcard.
8. Refresh the site and confirm your data remains in PostgreSQL.

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

