# Concept Lab

The product unit is a transferable idea, not a course silo. A lesson must distinguish
shared structure from claims of equivalence. Philosophy can offer interpretive
questions without being presented as empirical cognitive science.

## Data and rendering

`frontend/lib/lab/catalog.json` contains the curated bilingual lessons. The TypeScript
contract is in `frontend/lib/lab/types.ts`; the backend's Pydantic model is in
`backend/app/lab_schema.py`. Backend tests validate the entire curated catalog against
that contract. React renders all strings as text, never executable HTML or JavaScript.

The three renderer families are:

- Pipeline: sequential mechanisms, a deterministic tape machine, and explanatory levels.
- Memory: a contiguous 8-element array at byte address 4096 with 4-byte elements.
- Experiment: constant-stimulus framing, a discrete feedback controller, and a sine wave.

Feedback uses x[n+1] = x[n] + gain × (60 − x[n]), x[0] = 20. Gain is restricted to
0.1–1.9, within the stable range of this no-delay model. The chart does not assert
that real biological or economic systems have these dynamics. Waves use
sin(2πft) at fixed amplitude over one second. The tape machine flips four binary
symbols and halts at a blank. Simulations have reset/step controls and respect reduced
motion. Perception framing changes only the caption, not dot paths or speed.

## AI generation

The original extraction/upload pipeline supplies course text. The backend sends only
the configured `MAX_AI_CHARS` prefix and persists a visible truncation flag. Prompted JSON, locally validated and repaired at most once, creates 1–4 pipeline lessons with 2–4 cross-domain bridges each.
Every bridge includes a mapping and boundary. Every lesson includes a challenge and
exact source quotes. A page reference is accepted only when that quote occurs within
that page's extraction marker. No generated external URLs are accepted.

Invalid output returns 502 without provider secrets or partial writes. Free-model rate limits
return 429; provider availability/authentication failures return 503. Transport failures
are not automatically retried. Malformed content receives at most one repair request.
No API key returns 503. Successful lessons persist separately from notes. Repeated
POSTs return saved lessons rather than silently spending on regeneration. Concurrent
requests are protected against duplicate rows by the unique document key, though
concurrent first-generation requests may still incur multiple provider calls.

## Extending the collection

1. Add a lesson conforming to the schema, with both languages populated.
2. Connect at least two fields and explain each analogy's limitation.
3. Select a renderer whose actual mechanism fits. Do not relabel a numerical simulation
   to imply a different empirical law.
4. Supply a diagnostic question with one unambiguous correct option and an explanation.
5. Run schema/API tests, type checks, build and browser tests.

The seed catalog spans computing, cognition, philosophy, mathematics, biology,
linguistics, engineering, economics, music, physics, psychology and education.
Course-specific source files from the original product discussion were not provided;
curated lessons are labeled examples, not purported extractions of those lectures.

## Limitations and next increments

- No new account system or multi-user data isolation; these remain inherited MVP gaps.
- Progress is device-local and can be lost when browser storage is cleared.
- Generated lessons currently use pipeline walkthroughs, not arbitrary numerical models.
- Source substring checks cannot establish pedagogical or scientific correctness.
- Future work: retrieval over full documents, reviewed discipline packs, a richer
  relationship graph, evidence-backed concept links and transfer assessments over time.

Selected background references used in the curated collection:
- https://plato.stanford.edu/entries/wang-yangming/
- https://openstax.org/books/biology-2e/pages/33-3-homeostasis
- https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b:free
