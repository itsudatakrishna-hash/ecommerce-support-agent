import os
import json
from typing import AsyncGenerator
from groq import AsyncGroq
from tools import TOOL_DEFINITIONS, execute_tool_call

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = (
    "You are a helpful e-commerce customer support AI agent. You help customers with:\n"
    "- Tracking orders and checking delivery status\n"
    "- Processing refunds and returns\n"
    "- Creating support tickets for unresolved issues\n"
    "- Escalating complex cases to human agents\n\n"
    "Always be empathetic, concise, and professional. When a customer mentions an order, always use lookup_order first.\n"
    "If a refund is requested and eligible, process it immediately. For complex issues, create a ticket.\n"
    "Only escalate to a human when the customer is frustrated or the issue cannot be resolved automatically."
)


async def run_agent_stream(
    message: str,
    conversation_history: list[dict],
) -> AsyncGenerator[dict, None]:
    """
    Async generator that drives the Groq tool-calling loop and yields SSE event dicts.

    Event shapes:
      {"type": "tool_start",  "tool_name": str, "tool_input": dict}
      {"type": "tool_result", "tool_name": str, "result": dict}
      {"type": "text_delta",  "text": str}
      {"type": "done"}
      {"type": "error",       "message": str}
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": m["role"], "content": m["content"]} for m in conversation_history],
        {"role": "user", "content": message},
    ]

    try:
        while True:
            response = await client.chat.completions.create(
                model=MODEL,
                max_tokens=1024,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                messages=messages,
            )

            choice = response.choices[0]
            assistant_msg = choice.message

            # Build the assistant entry to push back into messages
            assistant_entry: dict = {"role": "assistant", "content": assistant_msg.content}
            if assistant_msg.tool_calls:
                assistant_entry["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in assistant_msg.tool_calls
                ]
            messages.append(assistant_entry)

            if choice.finish_reason == "stop":
                if assistant_msg.content:
                    yield {"type": "text_delta", "text": assistant_msg.content}
                break

            elif choice.finish_reason == "tool_calls":
                if assistant_msg.content:
                    yield {"type": "text_delta", "text": assistant_msg.content}

                for tool_call in assistant_msg.tool_calls or []:
                    tool_name = tool_call.function.name
                    tool_input = json.loads(tool_call.function.arguments)

                    yield {"type": "tool_start", "tool_name": tool_name, "tool_input": tool_input}

                    result = execute_tool_call(tool_name, tool_input)
                    yield {"type": "tool_result", "tool_name": tool_name, "result": result}

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result),
                    })

            else:
                # Unexpected finish reason — exit loop
                break

        yield {"type": "done"}

    except Exception as exc:
        yield {"type": "error", "message": str(exc)}
