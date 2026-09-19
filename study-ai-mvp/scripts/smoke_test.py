"""Run from project root after backend dependencies are installed: python scripts/smoke_test.py"""
import os, sys, tempfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
os.environ['DATABASE_URL']='sqlite:///./smoke_studyai.db'
os.environ['UPLOAD_DIR']='./smoke_uploads'

from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)
assert client.get('/health').status_code==200
s=client.post('/subjects',json={'name':'Smoke Test','icon':'🧪','color':'indigo'})
if s.status_code==409:
    subjects=client.get('/subjects').json(); sid=next(x['id'] for x in subjects if x['name']=='Smoke Test')
else:
    assert s.status_code==201, s.text; sid=s.json()['id']
f=client.post(f'/subjects/{sid}/folders',json={'name':'Lectures'}); assert f.status_code==201, f.text
with open(root/'samples'/'cpsc213_cache_sample.md','rb') as fh:
    d=client.post('/documents/upload',data={'subject_id':str(sid),'folder_id':str(f.json()['id'])},files={'file':('sample.md',fh,'text/markdown')})
assert d.status_code==201,d.text
g=client.post(f"/documents/{d.json()['id']}/generate",json={'bilingual':True,'include_flashcards':True}); assert g.status_code==200,g.text
cards=client.get(f"/documents/{d.json()['id']}/flashcards"); assert cards.status_code==200 and len(cards.json())>=1
print('StudyAI smoke test: PASS')
