# E-Commerce Support Agent — Backend

Node.js + Express API that powers the AI agent using the Anthropic SDK with tool calling.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
```

Server starts at `http://localhost:3001`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | SSE stream: runs the agent loop and emits tool events + final response |
| `GET`  | `/api/orders` | All mock orders |
| `GET`  | `/api/orders/:id` | Single order by ID |
| `GET`  | `/api/tickets` | All support tickets (includes agent-created ones) |
| `GET`  | `/api/conversations` | Conversation history |
| `GET`  | `/health` | Status check |

## SSE Event Format

`POST /api/chat` accepts `{ message, conversation_history }` and streams:

```json
data: {"type": "tool_start",  "tool_name": "lookup_order", "tool_input": {"order_id": "1042"}}
data: {"type": "tool_result", "tool_name": "lookup_order", "result": {...}}
data: {"type": "text_delta",  "text": "Your order #1042..."}
data: {"type": "done"}
```

## Agent Tools

- **lookup_order** — Returns order details from mock database
- **process_refund** — Validates eligibility, creates refund record
- **create_ticket** — Creates a new support ticket
- **escalate_to_human** — Returns escalation reference ID

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...   # Required
PORT=3001                       # Optional, default 3001
```
