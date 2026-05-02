# ElectGuide-AI

ElectGuide-AI is an AI-powered assistant that helps users understand the Indian election process, voting steps, timelines, and voter eligibility through an interactive chat interface.

---

## Live Demo

ElectGuide-AI is deployed on Google Cloud Run.

https://electguide-ai-1000034027511.asia-south1.run.app/

---

## Problem Statement

Many citizens lack clear knowledge about election procedures, voter eligibility, and voting preparation. ElectGuide-AI provides an accessible assistant to guide voters through the election process in India.

---

## Key Features

| Feature | Description |
|---|---|
| Election Process Guide | Step-by-step walkthrough of how Indian elections work |
| Voting Preparation Guide | Pre-polling checklist for first-time voters |
| Polling Day Explanation | What to expect when you arrive at the booth |
| Voter Eligibility Checker | Checks age, citizenship, and registration status |
| Polling Booth Finder Guidance | Guidance on how to locate your assigned booth |
| Candidate Information Lookup | How to research candidates in your constituency |
| Election Timeline Visualization | Visual timeline of election stages |
| Election FAQ Responses | Covers NOTA, EVMs, VVPAT, MCC, and more |
| Election Facts Generator | Random election facts from the knowledge base |
| Myth vs Fact Election Education | Corrects common election misconceptions |
| Intent-based response engine | Instant deterministic responses for fast answers |
| Gemini AI fallback | Handles complex queries not covered by the intent engine |
| Context-aware conversation memory | Maintains last 2 exchanges for follow-up queries |
| Modern lightweight chat UI | Dark sidebar, animated messages, suggestion prompts |

---

## AI Model

ElectGuide-AI uses Google's Gemini API for advanced explanations.

**Model used:**

```
gemini-2.5-flash
```

The assistant calls the Gemini REST endpoint only when a query cannot be answered by the local knowledge modules. This design ensures fast responses and minimal API usage.

---

## Architecture

```
User
↓
Chat Interface (Vanilla HTML/CSS/JS)
↓
Intent Engine
↓
Election Knowledge Modules
↓
Gemini REST API (fallback for complex queries)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| AI Integration | Google Gemini REST API |
| Model | `gemini-2.5-flash` |
| Deployment | Google Cloud Run |
| Containerization | Docker (Alpine-based) |

---

## Example Demo Prompts

Try these in the chat to explore the assistant:

```
demo
how elections work in India
how do I register to vote
am I eligible to vote if I am 20
where is my polling booth
show election timeline
fact
can someone vote twice
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open: [http://localhost:8080](http://localhost:8080)

> **Note:** The assistant works without a Gemini API key using its built-in intent engine. Complex queries outside the knowledge base will show a graceful fallback message until the key is configured. Copy `.env.example` to `.env` and add your `GEMINI_API_KEY` to enable AI fallback.

---

## Running Tests

```bash
npm test
```

The test suite covers **24 test cases** including:

- Election timeline intent detection
- Polling booth finder intent
- Candidate information intent
- Voter eligibility checker (general, underage, eligible, unregistered)
- FAQ responses (NOTA, VVPAT, vote counting, EVM)
- Voting preparation and polling day process intents
- Follow-up context queries (generic and step-specific)
- Demo and help commands
- Election facts command
- Unmatched query handling

---

## Cloud Run Deployment

**Step 1 — Build and push the container:**

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/electguide-ai
```

**Step 2 — Deploy to Cloud Run:**

```bash
gcloud run deploy electguide-ai \
  --image gcr.io/PROJECT_ID/electguide-ai \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

Replace `PROJECT_ID` with your Google Cloud project ID and `YOUR_KEY` with your Gemini API key.

The service listens on `process.env.PORT` (Cloud Run injects this automatically, defaulting to `8080`).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key for complex query fallback |
| `PORT` | Optional | Port to listen on (default: `8080`) |

---

## Repository Structure

```
electguide-ai/
│
├── public/
│   ├── index.html          # Chat UI
│   ├── style.css           # Styles and animations
│   └── script.js           # Frontend logic, typing effect, suggestions
│
├── src/
│   ├── controllers/
│   │   └── chat.controller.js   # Request handler, conversation context memory
│   ├── routes/
│   │   └── chat.routes.js       # Express router
│   ├── services/
│   │   ├── intent.service.js    # Intent detection + eligibility checker
│   │   └── gemini.service.js    # Gemini REST API fallback
│   └── data/
│       └── election_knowledge.json  # Local knowledge base
│
├── tests/
│   └── intent.test.js      # 24 automated test assertions
│
├── Dockerfile
├── .dockerignore
├── .gitignore
├── .env.example
├── package.json
└── README.md
```

---

## Repository Constraints

This project intentionally uses a lightweight architecture without heavy frameworks to stay within the **10MB repository size limit** required for the challenge:

- No React, Vue, or frontend frameworks
- No UI component libraries
- No heavy build tooling
- All styling is vanilla CSS
- `node_modules` is excluded from the repository
