import copy
import json
import os
import sys
import tempfile
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
_tmp = tempfile.TemporaryDirectory()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}/test.db'
os.environ['UPLOAD_DIR'] = f'{_tmp.name}/uploads'
os.environ['OPENAI_API_KEY'] = ''
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.lab_schema import Concept, ConceptCollection
from app.lab import validate_grounding
from app.config import get_settings
from app import lab_routes

catalog = json.loads((ROOT / 'frontend/lib/lab/catalog.json').read_text())

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def generated():
    lesson = copy.deepcopy(next(x for x in catalog if x['id'] == 'cpu'))
    lesson['source_facts'] = [{'quote':'A processor fetches an instruction before decoding it.', 'page':1}]
    return {'concepts':[lesson]}

@pytest.fixture
def document(client):
    import uuid
    subject = client.post('/subjects', json={'name':str(uuid.uuid4())}).json()
    response = client.post('/documents/upload', data={'subject_id':subject['id']}, files={'file':('lecture.md', b'--- PAGE 1 ---\nA processor fetches an instruction before decoding it.', 'text/markdown')})
    assert response.status_code == 201
    return response.json()['id']

def test_catalog_is_valid_and_covers_multiple_disciplines():
    assert len(catalog) == 11
    assert len({c['id'] for c in catalog}) == len(catalog)
    assert len({f for c in catalog for f in c['fields']}) >= 9
    for item in catalog:
        concept = Concept.model_validate(item)
        assert all(b.boundary.en and b.boundary.zh for b in concept.bridges)

@pytest.mark.parametrize('mutation', ['answer', 'simulation', 'code', 'duplicate'])
def test_schema_rejects_broken_renderer_data(generated, mutation):
    item = generated['concepts'][0]
    if mutation == 'answer': item['challenge']['answer'] = 3
    if mutation == 'simulation': item['simulation'] = 'memory'
    if mutation == 'code': item['javascript'] = 'alert(1)'
    if mutation == 'duplicate': generated['concepts'].append(copy.deepcopy(item))
    with pytest.raises(ValidationError): ConceptCollection.model_validate(generated)

def test_grounding_checks_quote_and_its_actual_page(generated):
    result = ConceptCollection.model_validate(generated)
    text = '--- PAGE 1 ---\nA processor fetches an instruction before decoding it.\n--- PAGE 2 ---\nOther content.'
    validate_grounding(result, text)
    result.concepts[0].source_facts[0].page = 2
    with pytest.raises(ValueError): validate_grounding(result, text)
    result.concepts[0].source_facts[0].page = None
    result.concepts[0].source_facts[0].quote = 'An invented unsupported assertion.'
    with pytest.raises(ValueError): validate_grounding(result, text)

def test_specialized_simulations_not_generated(generated):
    result = ConceptCollection.model_validate(generated)
    result.concepts[0].simulation = 'state'
    with pytest.raises(ValueError): validate_grounding(result, 'A processor fetches an instruction before decoding it.')

def test_no_key_is_explicit_and_does_not_create_fake_lessons(client, document):
    assert client.get('/documents/999999/lab').status_code == 404
    assert client.post(f'/documents/{document}/lab').status_code == 503
    assert client.get(f'/documents/{document}/lab').status_code == 404

def test_generated_lesson_persists_and_is_reused(client, document, generated, monkeypatch):
    monkeypatch.setattr(get_settings(), 'openai_api_key', 'test-only')
    calls=[]
    def generate(title,text):
        calls.append(title)
        return generated, True
    monkeypatch.setattr(lab_routes, 'generate_concepts', generate)
    first = client.post(f'/documents/{document}/lab')
    assert first.status_code == 200, first.text
    assert first.json()['truncated'] is True
    assert client.get(f'/documents/{document}/lab').json() == first.json()
    assert client.post(f'/documents/{document}/lab').json() == first.json()
    monkeypatch.setattr(get_settings(), 'openai_api_key', '')
    assert client.post(f'/documents/{document}/lab').json() == first.json()
    assert len(calls) == 1
    assert any(l['document_id'] == document for l in client.get('/labs').json())

def test_failure_does_not_persist_or_leak_secrets(client,document,monkeypatch):
    monkeypatch.setattr(get_settings(),'openai_api_key','test-only')
    def fail(*args): raise ValueError('sensitive provider message')
    monkeypatch.setattr(lab_routes,'generate_concepts',fail)
    response = client.post(f'/documents/{document}/lab')
    assert response.status_code == 502
    assert 'sensitive' not in response.text
    assert client.get(f'/documents/{document}/lab').status_code == 404
    assert client.get(f'/documents/{document}').json()['status'] == 'extracted'
