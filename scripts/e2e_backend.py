"""Disposable HTTP backend for browser integration tests. Never uses real keys/data."""
import os
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'backend'))
with tempfile.TemporaryDirectory(prefix='studyai-e2e-') as directory:
    os.environ['DATABASE_URL'] = f'sqlite:///{directory}/test.db'
    os.environ['UPLOAD_DIR'] = f'{directory}/uploads'
    os.environ['OPENROUTER_API_KEY'] = ''
    os.environ['CORS_ORIGINS'] = 'http://127.0.0.1:3100,http://localhost:3100'
    os.chdir(directory)
    import uvicorn
    uvicorn.run('app.main:app', host='127.0.0.1', port=8000, log_level='warning')
