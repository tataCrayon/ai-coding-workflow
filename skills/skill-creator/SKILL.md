---
name: skill-creator
version: 1.0.0
description: "Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, update or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy."
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

- Decide what you want the skill to do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the results both qualitatively and quantitatively
  - While the runs happen in the background, draft some quantitative evals if there aren't any. Then explain them to the user
  - Use the `eval-viewer/generate_review.py` script to show the user the results for them to look at, and also let them look at the quantitative metrics
- Rewrite the skill based on feedback from the user's evaluation of the results
- Repeat until you're satisfied
- Expand the test set and try again at larger scale

Your job when using this skill is to figure out where the user is in this process and then jump in and help them progress through these stages.

Of course, you should always be flexible and if the user is like "I don't need to run a bunch of evaluations, just vibe with me", you can do that instead.

Then after the skill is done (but again, the order is flexible), you can also run the skill description improver to optimize the triggering of the skill.

## Communicating with the user

The skill creator is liable to be used by people across a wide range of familiarity with coding jargon. Pay attention to context cues to understand how to phrase your communication! It's OK to briefly explain terms if you're in doubt.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed.

1. What should this skill enable the AI to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works?

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until you've got this part ironed out.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier
- **description**: When to trigger, what it does. This is the primary triggering mechanism — include both what the skill does AND specific contexts for when to use it. Make the description a little bit "pushy" to combat under-triggering.
- **compatibility**: Required tools, dependencies (optional, rarely needed)
- **the rest of the skill**

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) — Always in context (~100 words)
2. **SKILL.md body** — In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** — As needed (unlimited, scripts can execute without loading)

**Key patterns:**
- Keep SKILL.md under 500 lines; if approaching this limit, add hierarchy with clear pointers
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks, organize by variant:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

#### Principle of Lack of Surprise

Skills must not contain malware, exploit code, or any content that could compromise system security. A skill's contents should not surprise the user in their intent if described.

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats:**
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern:**
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Try to explain to the model why things are important in lieu of heavy-handed MUSTs. Use theory of mind and try to make the skill general. Start by writing a draft and then look at it with fresh eyes and improve it.

### Test Cases

After writing the skill draft, come up with 2-3 realistic test prompts. Share them with the user for review. Save test cases to `evals/evals.json`.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

---

## Running and evaluating test cases

This section is one continuous sequence — don't stop partway through.

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize results by iteration (`iteration-1/`, `iteration-2/`, etc.).

### Step 1: Spawn all runs in the same turn

For each test case, spawn two subagents — one with the skill, one without (baseline). Launch everything at once so it all finishes around the same time.

Write an `eval_metadata.json` for each test case with a descriptive name based on what it's testing.

### Step 2: While runs are in progress, draft assertions

Draft quantitative assertions for each test case. Good assertions are objectively verifiable and have descriptive names.

### Step 3: Capture timing data

When each subagent completes, save `total_tokens` and `duration_ms` to `timing.json` in the run directory.

### Step 4: Grade, aggregate, and launch the viewer

1. **Grade each run** — evaluate each assertion against the outputs
2. **Aggregate into benchmark** — run the aggregation script to produce `benchmark.json` and `benchmark.md`
3. **Do an analyst pass** — surface patterns the aggregate stats might hide
4. **Launch the viewer** with both qualitative outputs and quantitative data

### Step 5: Read the feedback

Read `feedback.json` when the user is done reviewing. Empty feedback means the user thought it was fine.

---

## Improving the skill

### How to think about improvements

1. **Generalize from the feedback.** We're trying to create skills that can be used many times across many different prompts. Rather than overfitting to specific examples, try different metaphors or patterns.

2. **Keep the prompt lean.** Remove things that aren't pulling their weight. Read the transcripts to see if the skill is making the model waste time on unproductive things.

3. **Explain the why.** Try to explain the reasoning behind instructions. Today's LLMs are smart — when given good context they can go beyond rote instructions.

4. **Look for repeated work across test cases.** If all test cases independently write similar helper scripts, bundle that script in the skill.

### The iteration loop

After improving the skill:

1. Apply improvements to the skill
2. Rerun all test cases into a new `iteration-<N+1>/` directory
3. Launch the reviewer with `--previous-workspace` pointing at the previous iteration
4. Wait for review, improve again, repeat

Keep going until the user is happy, feedback is all empty, or you're not making meaningful progress.

---

## Description Optimization

The description field in SKILL.md frontmatter is the primary mechanism that determines whether the AI invokes a skill. After creating or improving a skill, offer to optimize the description for better triggering accuracy.

### Step 1: Generate trigger eval queries

Create 20 eval queries — a mix of should-trigger and should-not-trigger. Make queries realistic with concrete details. For **should-trigger** queries (8-10), think about coverage with different phrasings. For **should-not-trigger** queries (8-10), focus on near-misses.

### Step 2: Review with user

Present the eval set to the user for review.

### Step 3: Run the optimization loop

The optimization loop splits the eval set into 60% train and 40% test, evaluates descriptions, proposes improvements, and iterates up to 5 times. Selected by test score to avoid overfitting.

### Step 4: Apply the result

Update the skill's SKILL.md frontmatter with the best description. Show before/after and report scores.

---

## Advanced: Blind comparison

For rigorous comparison between two versions, use the blind comparison system — give two outputs to an independent agent without telling it which is which, and let it judge quality. This is optional and most users won't need it.

---

## Reference files

The agents/ directory contains instructions for specialized subagents:
- `agents/grader.md` — How to evaluate assertions against outputs
- `agents/comparator.md` — How to do blind A/B comparison
- `agents/analyzer.md` — How to analyze why one version beat another

The references/ directory has additional documentation:
- `references/schemas.md` — JSON structures for evals.json, grading.json, etc.

---

## Core loop summary

1. Figure out what the skill is about
2. Draft or edit the skill
3. Run the AI with the skill on test prompts
4. Evaluate the outputs with the user (qualitatively + quantitatively)
5. Repeat until satisfied
6. Optimize the description for triggering accuracy
