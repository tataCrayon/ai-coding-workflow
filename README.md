<p align="right"><b>English</b> · <a href="./README.zh-CN.md">中文</a></p>

# ai-coding-workflow

> **Make AI work like a real senior engineer.**
>
> This is more than a workflow — it's a **portable, business-agnostic "cognitive operating system"** for an AI engineer. Drop it into any repository, feed one prompt to your AI, and it bootstraps a complete collaboration system: an AI that **does its homework before acting, stays within guardrails, remembers its lessons, and grows with your project**.
>
> The goal isn't "let AI write a few lines of code for you" — it's "give AI the working style, judgment, and growth of a seasoned engineer".

<p align="center">
  <a href="#-why-you-need-it">Why</a> ·
  <a href="#-30-second-quick-start">Quick Start</a> ·
  <a href="#-what-makes-it-special">Highlights</a> ·
  <a href="#-the-four-layer-architecture">Architecture</a> ·
  <a href="#-documentation">Docs</a>
</p>

<p align="center">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="status" src="https://img.shields.io/badge/status-production--proven-success.svg">
  <img alt="ide" src="https://img.shields.io/badge/works%20with-Cursor%20%7C%20Claude%20Code%20%7C%20any%20agent-orange.svg">
</p>

---

## 💡 Why you need it

Today's AI coding assistants are powerful, but everyone who's used one has hit the same walls:

| Pain point | You've definitely experienced | What this workflow does about it |
|------------|-------------------------------|----------------------------------|
| **AI forgets** | A new conversation = total amnesia; you re-explain the project every time | Memory system + knowledge assets + task persistence — context survives across sessions |
| **AI hallucinates** | Invents classes and methods that don't exist; acts after reading just one file | Four-questions-before-acting + Spec-first + automated fact-verification |
| **AI goes off the rails** | Loops endlessly breaking code, or over-engineers far beyond the requirement | Circuit-breaker protocol + reversibility tiers + context-isolated sub-agents |
| **AI never grows** | Makes the same mistake again; ignores yesterday's correction | Compound Learning loop — every correction becomes a memory/rule; it gets to know your project better over time |

> This is not yet another "prompt template". It's a **constrained, self-reflective, evolvable** cognitive OS — it encodes a senior engineer's working style (research first, respect boundaries, retrospect, accumulate experience) into muscle memory the AI follows at every step.

---

## 🚀 30-second quick start

```bash
# 1. Drop this repo into your project as a subdirectory, or just clone it
git clone https://github.com/<your-name>/ai-coding-workflow.git
```

2. Open **[`BOOTSTRAP.md`](./BOOTSTRAP.md)** and copy the "bootstrap prompt" inside.

3. Paste it into your AI IDE (Cursor / Claude Code / any agent that supports custom rules).

**That's it.** The AI will automatically: analyze your repo → deploy the workflow files → fill in placeholders → generate a first draft of `.notes/` knowledge assets → self-verify.

> Want to deploy manually or understand what each file does? See **[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)**.

---

## ✨ What makes it special

This workflow wasn't designed on a whim — it was forged through countless iterations on **real enterprise-grade production projects**. A few designs that genuinely matter:

### 🧭 Four Questions Before Acting — give AI an "instinct"
Before touching anything, the AI auto-checks four things: **recall past lessons → route to the right skill → consult project knowledge → verify the code entity actually exists**. This turns "AI guessing" into "AI doing its homework first".

### 📐 Spec-first + Test-cases-first — kill defects before writing code
Complex tasks are not allowed to start with code. First produce a **fact-verified technical spec**, then run path verification, consistency checks, pre-mortem reasoning, and multi-perspective review. The companion "test-cases-first" philosophy — **write stable behavioral contracts at design time, only run regressions while coding, and materialize test classes after the code is finalized** — eliminates the chronic pain of "tests churning along with the implementation".

### 🧠 Memory that "assists decisions" — not just remembering, but actively avoiding
Many AI tools now have memory, but most stop at "remembering your preferences". **This workflow's memory goes further — it actively recalls and participates in decisions before every action.**

- **Categorized accumulation**: preference / feedback / insight / reference — four types, each with a clear role
- **Active recall (Q0 of the four questions)**: before acting, scan the memory index; load any relevant lesson and **avoid the mistake before it happens**, instead of realizing it afterward
- **Promotion mechanism**: every memory carries a "why" so edge cases can be judged; critical lessons get promoted to enforced rules
- **Memory hygiene**: auto-detect staleness, merge duplicates, cap capacity — memory never devolves into clutter

> In one line: other tools' memory is "the AI remembers what you said"; here, memory is "before doing anything, the AI first recalls where it tripped on this kind of task before".

### 🔄 Compound Learning — never trip on the same stone twice
Every correction triggers a loop of "root-cause analysis → memory-promotion evaluation → distill into a memory or rule". The longer you use it, the better it understands your project; mistakes turn into reusable assets — exactly what separates a senior engineer from a newcomer: **experience accumulates.**

### 🛡️ Circuit-breaker protocol — give AI a "fuse"
Three failed attempts in a row force a stop-and-rethink. An explicit progress counter + a five-level action ladder root out both "AI repeatedly breaking code" and "search-bombing" dead loops.

### 🧩 Four-layer architecture + 12 pluggable skills — both a constitution and a toolbox
From the "constitution" (AGENTS.md) to routing to skills to the feedback loop — cleanly layered, each with its job. The 12 skills are trimmable on demand, covering the full dev lifecycle from unit testing and code review to architecture guarding and knowledge distillation.

### 🔌 Tool-agnostic — bound to no IDE, bound to no business
Designed entirely with neutral conventions and placeholders — runs on Cursor, Claude Code, or any agent. All business coupling has been stripped out, so it adapts to any language and any domain.

---

## 📐 The four-layer architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 4 · Loop & Persistence    task persistence · breaker ·      │  ← gets smarter
│                                  observation · memory              │     over time
├──────────────────────────────────────────────────────────────────┤
│  Layer 3 · Capabilities          13 Skills · sub-agents · orch.  │  ← the toolbox
├──────────────────────────────────────────────────────────────────┤
│  Layer 2 · Routing & Decision    skill routing · knowledge        │  ← the dispatcher
│                                  routing · complexity triage      │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1 · Constitution          AGENTS.md · coding standards ·    │  ← the constitution
│                                  behavioral boundaries            │
└──────────────────────────────────────────────────────────────────┘
```

Full design philosophy and data flow: **[`ai-coding-workflow-architecture.md`](./ai-coding-workflow-architecture.md)**.

---

## 📂 Repository structure

```
ai-coding-workflow/
├── README.md                              # This file — English landing page
├── README.zh-CN.md                        # Chinese landing page
├── BOOTSTRAP.md                           # ⭐ One-shot bootstrap prompt
├── ai-coding-workflow-architecture.md     # Four-layer architecture guide
├── AGENTS.md                              # Agent entry (identity/principles/boundaries/loop)
├── LICENSE                                # MIT
├── docs/
│   └── DEPLOYMENT.md                          # Manual deploy guide + trimming + checklist
│
├── rules/                                 # Constitution layer (10 rules)
│   ├── greeting.md                            # Greeting/addressing preference (optional)
│   ├── coding-standards.md                    # Coding aesthetics + ten self-check questions
│   ├── task-execution.md                      # Task framework (Spec-first + test-cases-first)
│   ├── circuit-breaker.md                     # Circuit-breaker protocol (anti dead-loop)
│   ├── knowledge-router.md                    # Knowledge-asset scenario routing
│   ├── knowledge-index.md                     # Knowledge-asset keyword index
│   ├── eval-observer.md                       # AI interaction observation + friction logging
│   ├── task-persistence.md                    # Task persistence + multi-round convergence
│   ├── skill-routing.md                       # Skill disambiguation routing table
│   └── skill-orchestration.md                 # Skill orchestration + Agent data hand-off
│
├── skills/                                # Capability layer (12 skills, each with SKILL.md)
│   ├── task-spawner/                          # Task spawning + context compression
│   ├── unit-test-master/                      # Unit-testing engine
│   ├── code-review-checklist/                 # Code review + production-readiness
│   ├── architecture-guard/                    # Architecture compliance check
│   ├── code-business-analyzer/                # Business-logic analysis engine
│   ├── code-concept-tracer/                   # Concept tracer
│   ├── java-change-impact-analyzer/           # Change-impact analysis
│   ├── spec-verifier/                         # Spec fact-verification
│   ├── cr-review-pipeline/                    # CR review pipeline
│   ├── knowledge-asset-manager/               # Knowledge-asset steward
│   ├── workflow-retrospective/                # Workflow retrospective engine
│   └── skill-creator/                         # Skill creator
│
└── templates/                             # Scaffolding templates
    └── .notes-scaffold.md                     # .notes knowledge-asset directory structure
```

---

## 📖 Documentation

| I want to… | Go here |
|------------|---------|
| **Start right now** | [`BOOTSTRAP.md`](./BOOTSTRAP.md) — copy the prompt, feed it to your AI |
| **Deploy manually / trim on demand** | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) |
| **Understand the design** | [`ai-coding-workflow-architecture.md`](./ai-coding-workflow-architecture.md) |
| **Read the AI's "constitution"** | [`AGENTS.md`](./AGENTS.md) |

---

## 🤝 Contributing & extending

The core design philosophy of this workflow is **evolvability** — fork it, trim it, extend it.

- **Add a rule**: create `rules/{semantic-name}.md`
- **Add a skill**: use `skills/skill-creator` to scaffold a new skill
- **Add knowledge**: distill into `.notes/` across the Foundation / Patterns / Analysis layers

Follow the "knowledge-routing decision tree" in AGENTS.md to decide which layer new knowledge belongs to.

---

## 📄 License

[MIT](./LICENSE) © crayon

> This is a system I forged through countless iterations on real projects, distilling all my thinking on one question: **how do we make AI not just "able to write code", but actually work like a senior engineer — researching, judging, respecting boundaries, retrospecting, and growing.**
> Now it's open-source. I hope it helps everyone who wants to take AI Coding seriously. Enjoy. 🚀