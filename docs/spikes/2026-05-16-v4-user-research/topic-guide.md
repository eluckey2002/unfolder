# Interview topic guide — unfolder v4 user research

**Date:** 2026-05-16
**Format:** Semi-structured interview, ~30 simulated minutes of dialog per persona.
**Interviewer voice:** A user-research professional doing discovery work for a new browser-based papercraft unfolding tool. Neutral, curious, doesn't lead, doesn't pitch. Probes for *specific recent examples*, not opinions in the abstract.
**Interviewee voice:** The persona, in first person. Concrete examples from their workflow. Free to say "I don't know" or "I've never thought about that." Free to push back on the interviewer.

## Guardrails for the synthetic interview

1. **No leading.** Questions are open-ended ("walk me through…"), not loaded ("would you like a feature that…").
2. **Ground every answer in a specific recent project.** When asked an abstract question, the interviewee *should* respond with "well, the last time I built X…"
3. **Pain points come from stories, not gripes.** A useful pain point is "the last time I tried Z, I gave up because Y." Not "I wish it was easier."
4. **Magic-wand answers are allowed to be unrealistic.** That's their value.
5. **Don't pitch the tool.** No "imagine a tool that…" — we want their unprimed reaction.
6. **Don't introduce competitor names the persona didn't surface first.**
7. **Length target:** 1500–2500 words per transcript. Cover all sections; don't dwell on any one.

## Section 1 — Warmup (3 min)

- Tell me about yourself — what you do, where you live, what kind of stuff you make.
- How did you get into papercraft?
- How often do you make something — weekly, monthly, when the mood strikes?

## Section 2 — Most recent project, end to end (8 min)

> The goal here is a *concrete artifact walkthrough*, not a generalized workflow description.

- Tell me about the last papercraft thing you built. What was it?
- Walk me through it from "I want to make this" to "it's sitting on my shelf."
- Where did the model come from?
- If you didn't have a finished PDF, what did you do? (probe for: did they unfold their own, did they give up, did they find a substitute)
- What part of the process took longest? What part frustrated you most?
- What part was actually fun?

## Section 3 — Tools and workflow (6 min)

- What software, if any, do you use as part of papercraft?
- When did you first try it? How did that go?
- Has there been a tool you wanted to use but bounced off? Why?
- If you had to draw your "papercraft workflow" on a whiteboard, what would the boxes be?

## Section 4 — Pain probes (5 min)

> Direct probes for known pain dimensions. Stay open — don't suggest answers.

- Tell me about a time a model came out wrong. What happened? Did you finish it anyway, redo it, or abandon it?
- When you print a sheet and start cutting, are you ever surprised by what's on it?
- Have you ever wished a piece were split differently than the tool gave you? Or merged?
- How do you handle the tabs / glue flaps?
- After it's assembled, what does the result usually look like — clean, "good enough," or "I can see all the seams"?

## Section 5 — Edit and undo behaviors (3 min)

> Probe for whether they think of the unfold as something they edit, or just consume.

- Once a model is unfolded by software, do you ever change anything before printing? What kinds of things?
- Have you ever "undone" something in a papercraft tool? Did the undo work how you expected?
- Do you save your in-progress unfolds, or do you start fresh each time?

## Section 6 — Assembly help (3 min)

- When you're assembling, how do you keep track of which piece goes where?
- Do you ever lose your place? What gets you back on track?
- Do you use anything *besides* the printed sheet to assemble — reference images, the 3D model on screen, video?

## Section 7 — Magic wand (3 min)

- If a software fairy could give you any one feature for your next papercraft project, what would it be?
- What's the silliest, most over-the-top thing you'd want — even something you think is impossible?
- If unfolding software could disappear entirely and the model just magically appeared as a perfect PDF, would you miss anything about the current process?

## Section 8 — Cool-down (2 min)

- Anything I should have asked that I didn't?
- Anything you want to make sure is in the notes?

## Output format for transcripts

```
# Interview transcript — [Persona name]
Date: 2026-05-16 (synthetic)
Interviewer: UX researcher (neutral, evidence-seeking)
Interviewee: [Persona], [age], [one-line description]

## Section 1 — Warmup
**Interviewer:** [question]
**[Persona]:** [response, first-person, grounded in their backstory]

[…all sections…]

## Section 8 — Cool-down
[…]
```

Transcripts go in `interviews/persona-N-<name>-transcript.md`. The synthesizer reads only transcripts + competitive scan; does not read this guide or the persona file.
