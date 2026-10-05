"""Bounded teaching content. Renderers never execute model-generated code."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

class Bilingual(StrictModel):
    en: str = Field(min_length=1, max_length=1600)
    zh: str = Field(min_length=1, max_length=1600)

class Step(StrictModel):
    title: Bilingual
    detail: Bilingual

class Bridge(StrictModel):
    field: Bilingual
    example: Bilingual
    mapping: Bilingual
    boundary: Bilingual

class Challenge(StrictModel):
    question: Bilingual
    options: list[Bilingual] = Field(min_length=2, max_length=4)
    answer: int = Field(ge=0, le=3)
    explanation: Bilingual

    @model_validator(mode="after")
    def valid_answer(self):
        if self.answer >= len(self.options):
            raise ValueError("Answer must reference an existing option")
        return self

class Source(StrictModel):
    label: str = Field(min_length=1, max_length=240)
    url: str = Field(pattern=r"^https://", max_length=2000)

class SourceFact(StrictModel):
    quote: str = Field(min_length=12, max_length=600)
    page: int | None = Field(ge=1)

class Concept(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9-]{1,80}$")
    title: Bilingual
    pattern: Literal["representation", "systems", "feedback", "constraints", "levels"]
    fields: list[str] = Field(min_length=1, max_length=6)
    question: Bilingual
    intuition: Bilingual
    template: Literal["pipeline", "memory", "experiment"]
    simulation: Literal["pipeline", "state", "layers", "memory", "perception", "feedback", "waves"]
    steps: list[Step] = Field(min_length=2, max_length=8)
    bridges: list[Bridge] = Field(min_length=2, max_length=4)
    challenge: Challenge
    sources: list[Source] = Field(max_length=5)
    source_facts: list[SourceFact] = Field(max_length=6)

    @model_validator(mode="after")
    def renderer_matches(self):
        expected = {"pipeline":"pipeline", "state":"pipeline", "layers":"pipeline", "memory":"memory", "perception":"experiment", "feedback":"experiment", "waves":"experiment"}
        if self.template != expected[self.simulation]:
            raise ValueError("Simulation and template do not match")
        return self

class ConceptCollection(StrictModel):
    concepts: list[Concept] = Field(min_length=1, max_length=4)

    @model_validator(mode="after")
    def unique_ids(self):
        ids = [item.id for item in self.concepts]
        if len(ids) != len(set(ids)):
            raise ValueError("Concept IDs must be unique")
        return self
