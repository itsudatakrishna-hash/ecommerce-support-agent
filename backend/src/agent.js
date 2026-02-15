import Groq from 'groq-sdk'
import { toolDefinitions, executeToolCall } from './tools.js'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are a helpful e-commerce customer support AI agent. You help customers with:
- Tracking orders and checking delivery status
- Processing refunds and returns
- Creating support tickets for unresolved issues
- Escalating complex cases to human agents

Always be empathetic, concise, and professional. When a customer mentions an order, always use lookup_order first.
If a refund is requested and eligible, process it immediately. For complex issues, create a ticket.
Only escalate to a human when the customer is frustrated or the issue cannot be resolved automatically.`

/**
 * Runs the agent loop with SSE streaming.
 * Emits events to `res` (Express response object) in the format:
 *   data: { type, ... }\n\n
 *
 * Event types:
 *   - tool_start  { tool_name, tool_input }
 *   - tool_result { tool_name, result }
 *   - text_delta  { text }
 *   - done        {}
 *   - error       { message }
 */
export async function runAgentStream(message, conversationHistory, res) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  const emit = (event) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  }

  try {
    let continueLoop = true

    while (continueLoop) {
      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        tools: toolDefinitions,
        tool_choice: 'auto',
        messages,
      })

      const choice = response.choices[0]
      const assistantMessage = choice.message

      const assistantEntry = { role: 'assistant', content: assistantMessage.content }
      if (assistantMessage.tool_calls) {
        assistantEntry.tool_calls = assistantMessage.tool_calls
      }
      messages.push(assistantEntry)

      if (choice.finish_reason === 'stop') {
        if (assistantMessage.content) {
          emit({ type: 'text_delta', text: assistantMessage.content })
        }
        continueLoop = false

      } else if (choice.finish_reason === 'tool_calls') {
        if (assistantMessage.content) {
          emit({ type: 'text_delta', text: assistantMessage.content })
        }

        for (const toolCall of assistantMessage.tool_calls || []) {
          const toolName = toolCall.function.name
          const toolInput = JSON.parse(toolCall.function.arguments)

          emit({ type: 'tool_start', tool_name: toolName, tool_input: toolInput })

          const result = executeToolCall(toolName, toolInput)
          emit({ type: 'tool_result', tool_name: toolName, result })

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          })
        }

      } else {
        continueLoop = false
      }
    }

    emit({ type: 'done' })

  } catch (err) {
    emit({ type: 'error', message: err.message || 'Agent error' })
  }
}
