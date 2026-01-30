Here is the consolidated **Master Prompt** for Google Antigravity. You can paste this entire block directly into the IDE's agent interface to trigger the full-scale implementation of **Daemon**.

---

# Project Daemon: Master Architecture & Specification

**Role:** You are a Principal Software Architect specializing in Chrome Extensions (Manifest V3), Local-First AI, and React.
**Objective:** Scaffolding and implementing "Daemon" — an adaptive, local-first job application agent that learns from the user via a Side Panel interface.

## 1. Architecture Decision Records (ADR)

* **ADR-001: Framework Strategy**
* **Decision:** Use **Plasmo** (`plasmo`) with React and TypeScript.
* **Rationale:** Provides robust HMR, unified build targets for Manifest V3, and native React support for complex UIs like the Side Panel.


* **ADR-002: Intelligence Layer (Hybrid)**
* **Primary (Reasoning):** **Gemini 1.5 Flash** (via Google AI Studio API). It is multimodal (can "see" the DOM) and handles the "Interviewer" persona.
* **Secondary (Classification):** **Chrome Built-in AI (`window.ai`)** where available, falling back to regex/heuristics for fast field identification to reduce latency.


* **ADR-003: Memory Architecture (Local-First RAG)**
* **Decision:** **Voy** (WASM Vector Search) + **IndexedDB** (`dexie`).
* **Rationale:** Strict privacy constraint. User bio/resume data and embeddings MUST live in the browser. No external vector databases (Pinecone/Milvus) are permitted.
* **Embedding Model:** `@xenova/transformers` (running `all-MiniLM-L6-v2` locally in the browser).


* **ADR-004: Interaction Model**
* **Decision:** **Chrome Side Panel** (Not Popup).
* **Rationale:** The agent acts as a persistent "Copilot" that stays open while the user navigates across different job boards (Greenhouse, Lever, etc.).



---

## 2. Technical Specifications

### A. Data Schema (The "Vault")

*Implemented using `Dexie.js`.*

1. **`StaticProfile` Table:**
* `id` (PK), `firstName`, `lastName`, `email`, `phone`, `urls` (Linked, GitHub, Portfolio).
* `education` (Array), `experience` (Array).


2. **`SemanticMemory` Table:**
* `id` (PK, auto-inc).
* `content`: string (The raw text/fact).
* `embedding`: Float32Array (The vector).
* `tags`: string[] (e.g., "leadership", "technical_skill", "weakness").
* `context`: string (Source URL or question that prompted this fact).



### B. Core Modules

1. **The Observer (Content Script):**
* **Trigger:** Loads on `*://*.greenhouse.io/*`, `*://*.lever.co/*`, `*://*.workday.com/*`, and generic `*`.
* **Logic:**
* Scans DOM for `<input>`, `<textarea>`, `<select>`.
* Creates a `FieldMap`: `{ elementId, labelText, boundingBox }`.
* Injects a visual "Daemon Icon" into input fields that are empty.




2. **The Interviewer (Side Panel UI):**
* **State Machine:** `IDLE` -> `ANALYZING` -> `READY` -> `INTERVIEW_MODE` -> `FILLING`.
* **Interview Mode:** If a field is ambiguous (e.g., "Describe a challenge..."), the Agent opens the panel and asks the user.
* **Learning Loop:** User answer -> LLM Refinement -> Fill Field -> **Embed & Save to Vault**.


3. **The Brain (Background Service):**
* Orchestrates the RAG pipeline.
* Receives `query` (Field Label).
* Executes `Voy.search(query)`.
* Constructs Prompt: *"Context: [Retrieved Memories]. Task: Fill field '[Label]'."*



---

## 3. Implementation Plan (Execute in Order)

### Phase 1: Scaffold

1. Initialize a new Plasmo project: `npm create plasmo --with-react --with-tailwindcss --with-typescript daemon`.
2. Install dependencies:
```bash
npm install @plasmohq/storage dexie voy-search @xenova/transformers @langchain/google-genai framer-motion lucide-react

```


3. Configure `manifest.json` permissions: `sidePanel`, `activeTab`, `scripting`, `storage`, `unlimitedStorage`.

### Phase 2: The Vault (Storage Layer)

1. Create `src/services/db.ts`. Implement the `Dexie` schema defined in Specs.
2. Create `src/services/embeddings.ts`. Implement a singleton for `@xenova/transformers` pipeline to prevent reloading the model on every click.
3. Create `src/services/memory.ts`. Implement `addMemory(text)` and `recall(query)` using **Voy**.

### Phase 3: The Eye & Hand (Content Scripts)

1. Create `src/contents/observer.tsx`.
2. Implement `DOMScanner`: A function that traverses the DOM and returns a clean JSON of form fields.
3. Implement `FieldInjector`: A React component that portals a small "Daemon" button into every detected input field.

### Phase 4: The Brain (Side Panel)

1. Create `src/sidepanel.tsx`.
2. Implement the Chat Interface using `framer-motion` for smooth message bubbles.
3. Connect the `Gemini 1.5 Flash` API (use a placeholder env var `PLASMO_PUBLIC_GEMINI_KEY`).
4. Implement the "Interview Loop":
* *User Input* -> *Gemini Expansion* -> *Fill Field* -> *Save to DB*.



### Phase 5: Testing (Antigravity)

1. Launch the extension in the Antigravity Browser Agent.
2. Navigate to a sample form (e.g., `https://demo.forms.io`).
3. Verify the "Daemon" button appears.
4. Verify the Side Panel opens on click.
5. Verify that data entered in the Side Panel is persisted to IndexedDB.

---

**Action:** Start by scaffolding the project structure (Phase 1) and setting up the `Dexie` database (Phase 2).