"""Exercise the real OpenAI-compatible client against a local mock HTTP transport."""
import json
import httpx
import pytest
from openai import OpenAI as RealOpenAI
from app import llm
from app.config import get_settings, Settings
from app.ai import generate_study_notes, _fallback_notes
from app.lab import generate_concepts
from app.lab_schema import ConceptCollection

@pytest.fixture
def provider(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, 'openrouter_api_key', 'test-secret-never-real')
    monkeypatch.setattr(settings, 'openrouter_model', 'nvidia/nemotron-3-ultra-550b-a55b:free')
    requests=[]
    def install(replies):
        queue=iter(replies)
        def handle(request):
            assert str(request.url) == 'https://openrouter.ai/api/v1/chat/completions'
            body=json.loads(request.content)
            requests.append(body)
            assert body['model'] == 'nvidia/nemotron-3-ultra-550b-a55b:free'
            assert 'response_format' not in body and 'models' not in body
            assert request.headers['authorization'] == 'Bearer test-secret-never-real'
            reply=next(queue)
            if isinstance(reply, int):
                return httpx.Response(reply, json={'error':{'message':'provider-sensitive-message'}})
            return httpx.Response(200,json={'id':'chat-test','object':'chat.completion','created':0,'model':body['model'],
                'choices':[{'index':0,'finish_reason':'stop','message':{'role':'assistant','content':reply}}]})
        def client(**kwargs):
            return RealOpenAI(**kwargs,http_client=httpx.Client(transport=httpx.MockTransport(handle)))
        monkeypatch.setattr(llm,'OpenAI',client)
        return requests
    return install


def test_default_model_is_explicitly_free():
    config=Settings(_env_file=None)
    assert config.openrouter_model == 'nvidia/nemotron-3-ultra-550b-a55b:free'


def test_valid_json_uses_chat_endpoint_without_schema_parameter(provider):
    requests=provider(['{"ok":true}'])
    assert llm.generate_json('instructions','source',lambda x:x)=={'ok':True}
    assert len(requests)==1


def test_malformed_json_is_repaired_once_on_same_model(provider):
    requests=provider(['not JSON','```json\n{"ok":true}\n```'])
    assert llm.generate_json('instructions','source',lambda x:x)=={'ok':True}
    assert len(requests)==2
    assert requests[1]['messages'][-2]['content']=='not JSON'


def test_invalid_schema_after_repair_fails_closed(provider):
    requests=provider(['{}','{}'])
    with pytest.raises(llm.GenerationError,match='after one repair'):
        llm.generate_json('instructions','source',ConceptCollection.model_validate)
    assert len(requests)==2


@pytest.mark.parametrize('status',[429,401,403,503])
def test_rate_limit_and_provider_errors_do_not_retry_or_leak(provider,status):
    requests=provider([status])
    with pytest.raises(llm.GenerationError) as exc:
        llm.generate_json('instructions','source',lambda x:x)
    assert exc.value.status_code == (429 if status==429 else 503)
    assert 'provider-sensitive-message' not in str(exc.value)
    assert 'test-secret' not in str(exc.value)
    assert len(requests)==1


def test_note_generation_uses_the_shared_openrouter_client(provider):
    fixture=_fallback_notes('Course','Source text')
    fixture['summary']={'en':'A validated explanation.','zh':'经过结构验证的讲解。'}
    requests=provider([json.dumps(fixture)])
    result=generate_study_notes('Course','Source text')
    assert result['summary']['en']=='A validated explanation.'
    assert len(requests)==1


def test_lesson_generation_validates_grounding_through_shared_client(provider):
    from pathlib import Path
    catalog=json.loads((Path(__file__).resolve().parents[2]/'frontend/lib/lab/catalog.json').read_text())
    lesson=next(c for c in catalog if c['id']=='cpu')
    lesson['source_facts']=[{'quote':'A processor fetches an instruction before decoding it.','page':None}]
    provider([json.dumps({'concepts':[lesson]})])
    result,truncated=generate_concepts('Course','A processor fetches an instruction before decoding it.')
    assert result['concepts'][0]['id']=='cpu'
    assert truncated is False


def test_missing_key_does_not_instantiate_client(monkeypatch):
    monkeypatch.setattr(get_settings(),'openrouter_api_key','')
    def fail(**kwargs): pytest.fail('Client should not be instantiated')
    monkeypatch.setattr(llm,'OpenAI',fail)
    with pytest.raises(llm.GenerationError) as exc:
        llm.generate_json('instructions','source',lambda x:x)
    assert exc.value.status_code==503
