

https://github.com/user-attachments/assets/50fa4db0-8fdc-420c-9c9c-97d0e073f87d



# E-Commerce Support Agent

An AI-powered customer support dashboard where a Claude agent handles queries end-to-end using real tool calling.

## Features

- **AI Chat** — Type any customer query and watch the agent decide which tools to call in real time
- **Tool Call Panel** — Live animated view of Order DB lookup, Refund API, Ticketing, and Escalation as they execute
- **Order Lookup** — Browse and search all orders with full detail panel including tracking timeline
- **Refund Management** — Approve pending refunds, create new requests, view processing stats
- **Ticket Management** — Create, filter, and update support tickets with priority levels
- **Conversation History** — Browse past sessions with expandable message threads
- **Status Badges** — Consistent resolved / pending / escalated / in-transit indicators throughout

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- lucide-react icons
- Node.js + Express backend with Anthropic SDK

## Quick Start

### Frontend

```bash
cd ecommerce-support-agent
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend (optional — frontend falls back to mock data without it)

```bash
cd ecommerce-support-agent/backend
npm install
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
# Runs at http://localhost:3001
```

## Architecture

The frontend connects to the backend via Server-Sent Events (SSE) for real-time tool call streaming:

```
Browser → POST /api/chat → Agent loop (Anthropic API)
                         ↓
              SSE events streamed back:
              { type: "tool_start",  tool_name, tool_input }
              { type: "tool_result", tool_name, result }
              { type: "text_delta",  text }
              { type: "done" }
```

If the backend is unavailable the frontend automatically falls back to client-side simulation.

## Available Agent Tools

| Tool | Description |
|------|-------------|
| `lookup_order` | Query order status, tracking, and shipping details |
| `process_refund` | Validate eligibility and create a refund record |
| `create_ticket` | Open a support ticket with configurable priority |
| `escalate_to_human` | Flag the conversation for human review |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `PORT` | Backend port (default: 3001) |
| `VITE_API_URL` | Frontend override for backend URL (default: http://localhost:3001) |
