from __future__ import annotations
import json
import re
from typing import Any
from .config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """You are StudyAI, a university learning assistant. Convert course material into accurate, teachable study notes.
Rules:
- Never invent facts not supported by the material. If uncertain, say so.
- Preserve important English technical terms even in Chinese explanations.
- For computer science: prefer step-by-step mechanisms, code/pseudocode, common bugs, and exam-style checks.
- For psychology: prefer definitions, mechanisms, research context, contrasts, real-life examples, and confounds/limitations when present.
- Use source_page only when a PAGE marker in the material supports it.
- Make 5 Why genuinely causal/deeper rather than repeating the same sentence.
- Cornell cues should be useful recall questions, not headings copied verbatim.
Return JSON only. No markdown fences.
"""

SCHEMA_HINT = {
    "title": "string",
    "summary": {"en": "string", "zh": "string"},
    "key_points": [{"concept": "string", "explanation_en": "string", "explanation_zh": "string", "importance": "high|medium|low", "source_page": 1}],
    "five_whys": [{"question_en": "string", "answer_en": "string", "question_zh": "string", "answer_zh": "string", "source_page": 1}],
    "cornell": {"rows": [{"cue_en": "string", "cue_zh": "string", "notes_en": "string", "notes_zh": "string", "source_page": 1}], "summary_en": "string", "summary_zh": "string"},
    "examples": [{"title": "string", "explanation_en": "string", "explanation_zh": "string", "code": "optional string", "source_page": 1}],
    "common_mistakes": [{"mistake_en": "string", "fix_en": "string", "mistake_zh": "string", "fix_zh": "string", "source_page": 1}],
    "flashcards": [{"front": "string", "back": "string", "card_type": "definition|why|compare|code|application", "source_page": 1}]
}


def _clean_json(text: str) -> dict[str, Any]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.I | re.S)
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        text = text[start:end + 1]
    return json.loads(text)


def _fallback_notes(title: str, text: str) -> dict[str, Any]:
    clean = re.sub(r"\s+", " ", text).strip()
    excerpt = clean[:1800] or "No extractable text was found."
    return {
        "title": title,
        "summary": {
            "en": "AI generation is in demo mode because OPENAI_API_KEY is not configured. Here is an excerpt from the uploaded material: " + excerpt[:900],
            "zh": "目前是演示模式，因为还没有配置 OPENAI_API_KEY。以下是上传资料的原文摘录：" + excerpt[:900],
        },
        "key_points": [{"concept": "Demo mode", "explanation_en": "Add an OpenAI API key to generate structured study notes.", "explanation_zh": "添加 OpenAI API Key 后即可生成完整结构化学习笔记。", "importance": "high", "source_page": None}],
        "five_whys": [],
        "cornell": {"rows": [], "summary_en": "Configure the API key to generate Cornell notes.", "summary_zh": "配置 API Key 后生成康奈尔笔记。"},
        "examples": [],
        "common_mistakes": [],
        "flashcards": [{"front": "What is required to enable AI note generation?", "back": "Set OPENAI_API_KEY in backend/.env.", "card_type": "definition", "source_page": None}],
    }


def generate_study_notes(title: str, text: str, bilingual: bool = True) -> dict[str, Any]:
    if not settings.openai_api_key:
        return _fallback_notes(title, text)

    material = text[: settings.max_ai_chars]
    user_prompt = f"""Create structured study notes for this document: {title}
Bilingual output required: {bilingual}
Target output shape (use null when source_page is unknown):
{json.dumps(SCHEMA_HINT, ensure_ascii=False)}

COURSE MATERIAL:
{material}
"""
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.responses.create(
        model=settings.openai_model,
        instructions=SYSTEM_PROMPT,
        input=user_prompt,
    )
    try:
        return _clean_json(response.output_text)
    except Exception:
        repair = client.responses.create(
            model=settings.openai_model,
            input=(
                "Repair the following into valid JSON matching this shape. Return JSON only.\n"
                + json.dumps(SCHEMA_HINT, ensure_ascii=False)
                + "\n\nBROKEN OUTPUT:\n"
                + response.output_text
            ),
        )
        return _clean_json(repair.output_text)
