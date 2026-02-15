const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Streams agent events from the backend.
 * Calls onEvent with each parsed SSE event object.
 * Returns the full assistant text when done.
 */
export async function streamChat(message, conversationHistory, onEvent) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history: conversationHistory }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() ?? ''

    for (const chunk of lines) {
      if (!chunk.startsWith('data: ')) continue
      try {
        const event = JSON.parse(chunk.slice(6))
        onEvent(event)
        if (event.type === 'text_delta') fullText += event.text
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText
}

export async function fetchOrder(orderId) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`)
  if (!res.ok) throw new Error(`Order ${orderId} not found`)
  return res.json()
}
