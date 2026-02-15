import json
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

from agent import run_agent_stream  # noqa: E402 — must load .env before importing agent
from mock_data import live_conversations, live_tickets, orders


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("E-Commerce Support Agent (Python/FastAPI) starting on http://localhost:3001")
    yield


app = FastAPI(title="E-Commerce Support Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ConversationMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list[ConversationMessage]] = []


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/api/chat")
async def chat(req: ChatRequest):
    """SSE streaming endpoint — emits agent events as they occur."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")

    history = [{"role": m.role, "content": m.content} for m in req.conversation_history]

    async def event_stream():
        async for event in run_agent_stream(req.message, history):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/orders")
def get_orders():
    return list(orders.values())


@app.get("/api/orders/{order_id}")
def get_order(order_id: str):
    order = orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.get("/api/tickets")
def get_tickets():
    return live_tickets


@app.get("/api/conversations")
def get_conversations():
    return live_conversations


@app.get("/health")
def health():
    return {"status": "ok", "model": "llama-3.3-70b-versatile", "tools": 4, "runtime": "python/fastapi"}


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
