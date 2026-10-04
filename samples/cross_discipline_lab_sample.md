# Shared structures across disciplines: a small learning lab

This is an original teaching sample for testing StudyAI, not a university lecture
transcript or a research report. Numerical examples are deliberately simplified.
The examples suggest transferable questions, not that different disciplines are
identical. Markdown has no reliable page numbering, so source citations should use
quotes without invented page references.

## Representation: an index is not an address

A contiguous array of 4-byte integers starts at byte address 4096. Its element at
index i starts at address 4096 + 4 × i. For i = 3, the address is 4108, or 0x100C.
The address selects a location; the value stored at that location is a separate
quantity. A map grid offers an analogy: a coordinate selects a place, but it does
not describe everything at that place. The analogy does not make a map a memory
system, and mental representations need not behave like computer pointers.

## Feedback: correcting a gap

Consider a toy discrete controller with initial state x = 20 and target 60.
Its update rule is x(next) = x + gain × (60 − x).
With gain 0.5, the first two updates produce 40 and 50. With gain 1.5, the first
update produces 80, crossing the target. This model has no delay or actuator limit.
It illustrates measurement, comparison and correction. Body temperature regulation
and inventory management motivate similar questions, but their actual mechanisms,
time delays and constraints require their own evidence and models.

## Constraints: allocating a fixed resource

A learner has 60 minutes. Allocating 40 minutes to reading leaves 20 for practice.
Increasing practice time to 40 minutes leaves 20 for reading. This is a fixed time
budget, not a claim that learning outcomes grow linearly with minutes. In economics,
opportunity cost concerns the value of the best alternative forgone. In computing,
a fixed memory budget limits allocations. Resource constraints transfer as a
question, while the meaning and measurement of value differ between these domains.

## Levels: ask which question is being answered

A sorting task can be described by its desired result, the procedure used to produce
that result, and the physical machine that runs the procedure. Producing ordered
output is a goal. Merge sort is one possible procedure. A processor is part of a
physical implementation. These are perspectives on one task, not three processing
stages. A description of hardware alone does not specify which algorithm it runs.

## Check your understanding

1. At which address does element 7 of the example array start?
2. Why does gain 1.5 overshoot on the first controller update?
3. What does choosing 40 minutes of practice rule out within the fixed time budget?
4. Why is a processor description insufficient to identify a sorting procedure?
5. For each analogy, name one shared structure and one important difference.
