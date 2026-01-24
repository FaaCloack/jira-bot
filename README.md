# jira-bot

`jira-bot` is a small service that connects **WhatsApp Business** with **Jira**, using an **AI model** to decide whether incoming messages should create, update, or enrich Jira tickets.

The goal is to turn unstructured chat messages into structured Jira work — with minimal friction for users.

---

## ✨ What it does

- Receives messages from WhatsApp Business via webhooks
- Allows users to forward messages to a dedicated **“Jira Bot”** chat
- Guides the user to select a Jira project
- Fetches relevant Jira tickets for context
- Uses AI to decide whether to:
  - Create a new Jira issue
  - Update an existing issue
  - Add a comment or description update
- Applies the change via the Jira REST API

---

## 🧠 High-level flow

1. A message is forwarded to the **Jira Bot** chat
2. The service asks which Jira project the message relates to
3. Jira tickets for that project are fetched
4. The AI model evaluates the message + Jira context
5. A Jira action is proposed and executed

---

## 🧱 Tech stack

- **Node.js + TypeScript**
- **Fastify** (HTTP server & webhooks)
- **Docker** (deployment)
- **WhatsApp Business Cloud API**
- **Jira REST API**
- **AI model API** (OpenAI / compatible)

---

## 🚀 Running locally

### Prerequisites
- Node.js 18+
- Docker (optional but recommended)

### Install & run

```bash
npm install
npm run build
npm start
