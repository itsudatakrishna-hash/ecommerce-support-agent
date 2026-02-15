import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { runAgentStream } from './agent.js'
import { orders, liveTickets, liveConversations } from './mockData.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// POST /api/chat — SSE streaming agent response
app.post('/api/chat', (req, res) => {
  const { message, conversation_history = [] } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  runAgentStream(message, conversation_history, res).finally(() => {
    if (!res.writableEnded) res.end()
  })
})

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
  const order = orders[req.params.id]
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

// GET /api/orders
app.get('/api/orders', (_req, res) => {
  res.json(Object.values(orders))
})

// GET /api/tickets
app.get('/api/tickets', (_req, res) => {
  res.json(liveTickets)
})

// GET /api/conversations
app.get('/api/conversations', (_req, res) => {
  res.json(liveConversations)
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: 'llama-3.3-70b-versatile', tools: 4 })
})

app.listen(PORT, () => {
  console.log(`E-Commerce Support Agent backend running on http://localhost:${PORT}`)
  console.log(`API key: ${process.env.GROQ_API_KEY ? 'set' : 'MISSING — set GROQ_API_KEY in .env'}`)
})
