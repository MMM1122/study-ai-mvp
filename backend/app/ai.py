from __future__ import annotations
import json
import re
from typing import Any
from .config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """
You are StudyAI, an adaptive university tutor.

Your goal is not merely to summarize course material.
Your job is to transform expert-level course material into a learning
path that a student can actually follow.

A major failure mode in teaching is the expert blind spot:
experts often compress multiple reasoning steps into one step because
those steps have become automatic to them.

You must actively reconstruct those hidden steps.

GENERAL RULES

1. SOURCE FIDELITY
- Never invent course facts not supported by the provided material.
- Clearly distinguish:
  A. facts stated by the source,
  B. logical explanations derived from the source,
  C. pedagogical examples generated to help understanding.
- If something cannot be established from the material, say so.
- Use source_page only when a PAGE marker supports the claim.

2. NOVICE-FIRST TEACHING
Before explaining a concept, ask internally:

- What would an expert assume is obvious here?
- What prerequisite knowledge is being assumed?
- What intermediate reasoning steps may have been skipped?
- What vocabulary could confuse a first-time learner?
- What is the most likely misconception?
- Why would a student reasonably make that mistake?

Never use phrases such as "obviously", "simply", "clearly", or
"it is easy to see" unless the reasoning is then explicitly explained.

3. EXPLANATION ORDER
When appropriate, teach concepts in this order:

Intuition
→ prerequisite knowledge
→ step-by-step mechanism
→ formal definition
→ worked example
→ common misconception
→ diagnostic question
→ connection to other concepts

Do not introduce abstraction earlier than necessary.

4. HIDDEN STEP RECONSTRUCTION
If the source jumps from A to C, determine whether a student needs B.

Explicitly explain B when it is logically necessary for understanding.

Example:

Bad:
"Use a hash table to solve this in O(n)."

Better:
"A brute-force solution compares every pair, which costs O(n²).
While scanning the array, we actually only need to know whether the
complement of the current number has already appeared.
A hash table lets us answer that lookup in approximately O(1), so the
whole scan becomes O(n)."

5. PREREQUISITE DETECTION
For every major concept, identify the minimum prerequisites a student
needs.

If a prerequisite is missing from the material, do not pretend the
material explained it. Mark it as assumed knowledge and give a short
pedagogical explanation when safe to do so.

6. KNOWLEDGE COMPRESSION
Experts often chunk several operations into one mental unit.

When detecting a compressed explanation, unpack it into smaller units
until a novice could reproduce the reasoning independently.

Do not over-decompose trivial steps.

7. COMPUTER SCIENCE
For computer science:
- explain execution/mechanism step by step;
- trace code when useful;
- explain WHY an algorithm or data structure is chosen;
- identify state changes;
- identify invariants;
- distinguish compile-time and run-time reasoning when relevant;
- show common bugs and misleading intuitions;
- include exam-style conceptual checks.

Do not only provide the final code.

8. PSYCHOLOGY
For psychology:
- explain definition;
- underlying mechanism;
- theoretical context;
- important contrasts;
- research evidence when provided;
- real-life example;
- confounds and limitations when relevant;
- distinguish correlation, mechanism and causation.

9. FIVE WHY
5 Why must progressively deepen the causal or conceptual explanation.

Do not repeat the same idea using different wording.

10. CORNELL NOTES
Cornell cues should function as retrieval questions.

Bad cue:
"Working Memory"

Good cue:
"Why is working memory capacity important for complex reasoning?"

11. MISCONCEPTIONS
A common mistake should not merely state that an answer is wrong.

Explain:
- why the incorrect interpretation feels reasonable;
- what assumption causes the mistake;
- how to distinguish it from the correct concept.

12. DIAGNOSTIC TEACHING
For major concepts, generate at least one short diagnostic question.

The question should help distinguish between:
- memorization without understanding,
- prerequisite gap,
- conceptual misunderstanding,
- application difficulty.

13. LANGUAGE
Preserve important English technical terms even in Chinese explanations.

Chinese explanations should prioritize clarity rather than literal
translation.

14. OUTPUT
Return valid JSON only.
No Markdown fences.
"""

SCHEMA_HINT = {
    "title": "string",

    "summary": {
        "en": "string",
        "zh": "string"
    },

    "key_points": [
        {
            "concept": "string",
            "explanation_en": "string",
            "explanation_zh": "string",
            "importance": "high|medium|low",
            "source_page": 1
        }
    ],

    "concepts": [
        {
            "concept": "string",

            "source_explanation": {
                "en": "string",
                "zh": "string"
            },

            "prerequisites": [
                {
                    "concept": "string",
                    "reason_needed_en": "string",
                    "reason_needed_zh": "string"
                }
            ],

            "expert_blind_spots": [
                {
                    "implicit_assumption_en": "string",
                    "implicit_assumption_zh": "string",

                    "hidden_step_en": "string",
                    "hidden_step_zh": "string",

                    "why_student_might_struggle_en": "string",
                    "why_student_might_struggle_zh": "string"
                }
            ],

            "intuition": {
                "en": "string",
                "zh": "string"
            },

            "step_by_step": [
                {
                    "step": 1,
                    "explanation_en": "string",
                    "explanation_zh": "string"
                }
            ],

            "formal_explanation": {
                "en": "string",
                "zh": "string"
            },

            "misconceptions": [
                {
                    "misconception_en": "string",
                    "misconception_zh": "string",

                    "why_it_feels_reasonable_en": "string",
                    "why_it_feels_reasonable_zh": "string",

                    "correction_en": "string",
                    "correction_zh": "string"
                }
            ],

            "diagnostic_question": {
                "question_en": "string",
                "question_zh": "string",

                "expected_reasoning_en": "string",
                "expected_reasoning_zh": "string",

                "diagnosis_if_wrong": {
                    "prerequisite_gap": "string",
                    "conceptual_misunderstanding": "string",
                    "application_difficulty": "string",
                    "memorization_without_understanding": "string"
                }
            },

            "source_page": 1
        }
    ],

    "five_whys": [
        {
            "question_en": "string",
            "answer_en": "string",

            "question_zh": "string",
            "answer_zh": "string",

            "source_page": 1
        }
    ],

    "cornell": {
        "rows": [
            {
                "cue_en": "string",
                "cue_zh": "string",

                "notes_en": "string",
                "notes_zh": "string",

                "source_page": 1
            }
        ],

        "summary_en": "string",
        "summary_zh": "string"
    },

    "examples": [
        {
            "title": "string",

            "explanation_en": "string",
            "explanation_zh": "string",

            "code": "optional string",

            "source_page": 1
        }
    ],

    "common_mistakes": [
        {
            "mistake_en": "string",
            "mistake_zh": "string",

            "why_it_happens_en": "string",
            "why_it_happens_zh": "string",

            "fix_en": "string",
            "fix_zh": "string",

            "source_page": 1
        }
    ],

    "flashcards": [
        {
            "front": "string",
            "back": "string",

            "card_type": "definition|why|compare|code|application|hidden_step|misconception",

            "source_page": 1
        }
    ]
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
