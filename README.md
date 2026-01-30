# Daemon

Daemon is an adaptive, local-first job application agent that lives in your browser's side panel. It learns from your inputs and helps you fill out job applications intelligently.

## Features

- **Local-First Architecture**: Your data stays on your device. We use `Dexie.js` for storage and `Voy` for in-browser vector search.
- **Smart Context**: Scans the page for input fields and offers relevant information from your personal vault.
- **AI-Powered**: Uses Google's **Gemini 1.5 Flash** to reason about questions and draft answers.
- **Privacy Focused**: Embeddings are generated locally using `@xenova/transformers`.

## Tech Stack

- **Framework**: [Plasmo](https://docs.plasmo.com/) (React + TypeScript)
- **AI/LLM**: Gemini 1.5 Flash (via Langchain)
- **Vector Search**: Voy (WASM)
- **Embeddings**: Xenova Transformers (`all-MiniLM-L6-v2`)
- **Database**: IndexedDB (via Dexie)
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js (v18+)
- A Google Gemini API Key

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone git@github.com:alfieprojectsdev/daemon.git
    cd daemon
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    PLASMO_PUBLIC_GEMINI_KEY=your_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  **Load Extension in Chrome**
    -   Go to `chrome://extensions`
    -   Enable **Developer Mode** (top right)
    -   Click **Load Unpacked**
    -   Select the `build/chrome-mv3-dev` directory

## Usage

1.  Navigate to any job application site (e.g., Greenhouse, Lever).
2.  Click the small **Daemon (D)** icon that appears next to input fields.
3.  The Side Panel will open.
4.  Chat with Daemon to provide information or ask it to recall details from your vault to fill the field.

## Building for Production

To create a production bundle:

```bash
npm run build
```

This will create a `build/chrome-mv3-prod` directory (or similar based on target).

## Architecture

-   **Observer**: A content script that watches the DOM for input fields and injects triggers.
-   **The Vault**: A local database (`src/services/db.ts`) storing your profile and semantic memories.
-   **The Brain**: The Side Panel (`src/sidepanel.tsx`) that orchestrates the interview loop and RAG pipeline.
