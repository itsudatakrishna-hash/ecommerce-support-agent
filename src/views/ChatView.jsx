import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Database, CreditCard, Ticket, AlertTriangle,
  CheckCircle2, Loader2, Package, Clock, MapPin, ChevronRight,
  X, Zap, MoreVertical, RefreshCw, ThumbsUp, Copy, ExternalLink,
} from 'lucide-react'
import { conversations as initialConvs, orders, agentTools, suggestedQueries } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import { streamChat } from '../api/chatApi'

const TOOL_ICONS = { Database, CreditCard, Ticket, AlertTriangle }
const TOOL_COLOR_MAP = {
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: 'text-indigo-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
}

function extractOrderId(text) {
  const m = text.match(/#(\d{4})/);
  return m ? m[1] : null
}

function buildAgentResponse(input, toolResults) {
  const orderId = extractOrderId(input)
  const lc = input.toLowerCase()

  if (orderId && orders[orderId]) {
    const o = orders[orderId]
    if (lc.includes('return') || lc.includes('refund')) {
      if (!o.refundEligible) return `I've reviewed order #${orderId} for ${o.item}. Unfortunately this order is not currently eligible for a refund as it has status "${o.status}". Would you like me to create a support ticket or escalate this to a human agent?`
      return `I've processed a refund request for order #${orderId} (${o.item}, $${o.price}). Refund confirmation **RF-44${Math.floor(Math.random()*90)+10}** has been issued. The $${o.price} will be returned to ${o.paymentMethod} within 3–5 business days. Is there anything else I can help you with?`
    }
    if (lc.includes('cancel')) {
      if (!o.refundEligible) return `Order #${orderId} (${o.item}) has status "${o.status}" and cannot be cancelled at this stage. I've created ticket **TK-${Math.floor(Math.random()*900)+9900}** and flagged it for a human agent to review.`
      return `Order #${orderId} for ${o.item} has been cancelled successfully. A full refund of $${o.price} will be credited to ${o.paymentMethod} within 2–3 business days.`
    }
    if (lc.includes('where') || lc.includes('status') || lc.includes('track') || lc.includes('deliver')) {
      if (o.status === 'in_transit') return `Your order #${orderId} (${o.item}) is currently **in transit** with ${o.carrier}. Tracking: \`${o.tracking}\`. Estimated delivery: **${o.estimatedDelivery}**. Heading to: ${o.shippingAddress}.`
      if (o.status === 'delivered') return `Great news! Order #${orderId} (${o.item}) was **delivered** to ${o.shippingAddress}. If you haven't received it, please let me know and I can investigate further.`
      if (o.status === 'processing') return `Order #${orderId} (${o.item}) is currently **processing** at our fulfillment center and hasn't shipped yet. Estimated ship date is within 1–2 business days.`
      return `Order #${orderId} (${o.item}) has status: **${o.status}**. Let me know how I can help you further.`
    }
  }

  if (lc.includes('ticket') || lc.includes('escalat') || lc.includes('human') || lc.includes('agent')) {
    return `I've created a support ticket **TK-${Math.floor(Math.random()*900)+9900}** and escalated this conversation to our human support team. You'll receive an email confirmation within 30 minutes. Reference your escalation ID **ESC-${Math.floor(Math.random()*9000)+1000}**.`
  }

  if (lc.includes('hello') || lc.includes('hi') || lc.includes('hey')) {
    return `Hello! I'm your AI support agent. I can help you track orders, process refunds, create tickets, or escalate to a human agent. What can I help you with today?`
  }

  return `I understand you need help with "${input.substring(0, 60)}". Could you provide an order number so I can look up the details? For example: "Where is my order #1042?"`
}

function decideTools(input) {
  const lc = input.toLowerCase()
  const tools = []
  const orderId = extractOrderId(input)
  if (orderId || lc.includes('order') || lc.includes('track') || lc.includes('deliver') || lc.includes('where')) tools.push('lookup_order')
  if (lc.includes('refund') || lc.includes('return') || lc.includes('money')) tools.push('process_refund')
  if (lc.includes('ticket') || lc.includes('issue') || lc.includes('complaint') || lc.includes('problem')) tools.push('create_ticket')
  if (lc.includes('escalat') || lc.includes('human') || lc.includes('manager') || lc.includes('supervisor')) tools.push('escalate_to_human')
  if (tools.length === 0) tools.push('lookup_order')
  return tools
}

function buildToolResult(toolId, input) {
  const orderId = extractOrderId(input)
  const order = orderId ? orders[orderId] : null
  if (toolId === 'lookup_order') {
    if (order) return { orderId: order.id, status: order.status, item: order.item, price: `$${order.price}`, tracking: order.tracking || 'N/A', estimatedDelivery: order.estimatedDelivery || 'N/A' }
    return { error: 'Order not found' }
  }
  if (toolId === 'process_refund') {
    return { refundId: `RF-44${Math.floor(Math.random()*90)+10}`, amount: order ? `$${order.price}` : '$0.00', status: 'approved', timeline: '3–5 business days' }
  }
  if (toolId === 'create_ticket') {
    return { ticketId: `TK-${Math.floor(Math.random()*900)+9900}`, priority: 'medium', assignee: 'Support Team L2', status: 'open' }
  }
  if (toolId === 'escalate_to_human') {
    return { escalationId: `ESC-${Math.floor(Math.random()*9000)+1000}`, priority: 'high', estimatedResponse: '< 30 min', status: 'escalated' }
  }
}

function ToolCard({ tool, status, result }) {
  const Icon = TOOL_ICONS[tool.icon] || Database
  const c = TOOL_COLOR_MAP[tool.color]
  return (
    <div className={`rounded-lg border p-3 transition-all ${
      status === 'running' ? `${c.bg} ${c.border} animate-tool-pulse` :
      status === 'done'    ? 'bg-slate-800/60 border-slate-700' :
                             'bg-slate-900 border-slate-800 opacity-50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} className={status === 'pending' ? 'text-slate-600' : c.icon} />
          <span className={`text-xs font-medium ${status === 'pending' ? 'text-slate-600' : status === 'done' ? 'text-slate-300' : c.text}`}>
            {tool.name}
          </span>
        </div>
        {status === 'running' && <Loader2 size={12} className={`${c.text} animate-spin`} />}
        {status === 'done'    && <CheckCircle2 size={12} className="text-emerald-400" />}
      </div>
      {status === 'done' && result && (
        <div className="mt-1 space-y-0.5 animate-fade-in">
          {Object.entries(result).slice(0, 4).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-[10px] text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="text-[10px] text-slate-300 font-mono truncate max-w-[120px]">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order }) {
  const statusColors = { in_transit: 'text-blue-400', delivered: 'text-emerald-400', processing: 'text-violet-400', returned: 'text-slate-400', cancelled: 'text-slate-400' }
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 animate-slide-down">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-200">Order #{order.id}</span>
        <StatusBadge status={order.status} size="xs" />
      </div>
      <p className="text-xs text-slate-300 font-medium truncate mb-2">{order.item}</p>
      <div className="space-y-1.5">
        {[
          { icon: Package, label: 'SKU', value: order.sku },
          { icon: Clock, label: 'Ordered', value: order.date },
          { icon: MapPin, label: 'Ship to', value: order.shippingAddress.split(',')[0] },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={10} className="text-slate-500 shrink-0" />
            <span className="text-[10px] text-slate-500">{label}:</span>
            <span className="text-[10px] text-slate-300 truncate">{value}</span>
          </div>
        ))}
        {order.tracking && (
          <div className="mt-1.5 bg-slate-900 rounded px-2 py-1">
            <p className="text-[10px] text-slate-500">Tracking</p>
            <p className="text-[10px] font-mono text-indigo-400 truncate">{order.tracking}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatView({ onNavigate }) {
  const [conversations, setConversations] = useState(initialConvs)
  const [activeConvId, setActiveConvId] = useState('conv-001')
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [toolStates, setToolStates] = useState({}) // { toolId: 'pending'|'running'|'done', result }
  const [toolResults, setToolResults] = useState({})
  const [activeOrderId, setActiveOrderId] = useState(null)
  const [showEscalateDialog, setShowEscalateDialog] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundTarget, setRefundTarget] = useState(null)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketPriority, setTicketPriority] = useState('medium')
  const [ticketIssue, setTicketIssue] = useState('')
  const bottomRef = useRef(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages, isThinking])

  const runAgentWithStreaming = useCallback(async (userMessage) => {
    setToolStates({})
    setToolResults({})
    setActiveOrderId(null)
    setIsThinking(true)

    const activeConv = conversations.find(c => c.id === activeConvId)
    const history = (activeConv?.messages || []).map(m => ({ role: m.role, content: m.content }))

    const usedTools = []
    let fullText = ''

    const handleEvent = (event) => {
      if (event.type === 'tool_start') {
        const toolId = event.tool_name
        usedTools.push(toolId)
        setToolStates(prev => ({ ...prev, [toolId]: 'running' }))
      } else if (event.type === 'tool_result') {
        const toolId = event.tool_name
        const result = event.result
        setToolResults(prev => ({ ...prev, [toolId]: result }))
        setToolStates(prev => ({ ...prev, [toolId]: 'done' }))
        if (toolId === 'lookup_order' && result?.order_id) {
          setActiveOrderId(result.order_id)
        }
      } else if (event.type === 'text_delta') {
        fullText += event.text
      }
    }

    try {
      fullText = await streamChat(userMessage, history, handleEvent)
    } catch (_err) {
      // Backend unavailable — fall back to client-side simulation
      const tools = decideTools(userMessage)
      for (const t of tools) {
        setToolStates(prev => ({ ...prev, [t]: 'running' }))
        await new Promise(r => setTimeout(r, 800))
        const result = buildToolResult(t, userMessage)
        setToolResults(prev => ({ ...prev, [t]: result }))
        setToolStates(prev => ({ ...prev, [t]: 'done' }))
        usedTools.push(t)
        if (t === 'lookup_order') {
          const orderId = extractOrderId(userMessage)
          if (orderId && orders[orderId]) setActiveOrderId(orderId)
        }
        await new Promise(r => setTimeout(r, 300))
      }
      await new Promise(r => setTimeout(r, 400))
      fullText = buildAgentResponse(userMessage, {})
    }

    setIsThinking(false)

    setConversations(prev => prev.map(c => {
      if (c.id !== activeConvId) return c
      const isEscalated = usedTools.includes('escalate_to_human') || userMessage.toLowerCase().includes('escalat')
      return {
        ...c,
        status: isEscalated ? 'escalated' : 'pending',
        lastMessage: fullText.substring(0, 60) + (fullText.length > 60 ? '…' : ''),
        messages: [...c.messages, {
          id: c.messages.length + 1,
          role: 'assistant',
          content: fullText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: usedTools,
        }],
      }
    }))
  }, [activeConvId, conversations])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isThinking) return
    const text = input.trim()
    setInput('')

    setConversations(prev => prev.map(c => {
      if (c.id !== activeConvId) return c
      return {
        ...c,
        lastMessage: text,
        messages: [...c.messages, {
          id: c.messages.length + 1,
          role: 'user',
          content: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }],
      }
    }))

    await runAgentWithStreaming(text)
  }, [input, isThinking, activeConvId, runAgentWithStreaming])

  const handleEscalate = () => {
    setShowEscalateDialog(false)
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, status: 'escalated' } : c))
    const msg = 'This conversation has been escalated to a human agent. You will be contacted within 30 minutes.'
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConvId) return c
      return { ...c, messages: [...c.messages, { id: c.messages.length + 1, role: 'system', content: msg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] }
    }))
  }

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          <span className="text-sm font-semibold text-slate-200">Conversations</span>
          <span className="text-[10px] bg-indigo-600/20 text-indigo-400 rounded-full px-1.5 py-0.5">
            {conversations.filter(c => c.unread > 0).length} new
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { setActiveConvId(conv.id); setToolStates({}); setToolResults({}); setActiveOrderId(null) }}
              className={`w-full text-left p-2.5 rounded-lg transition-all ${activeConvId === conv.id ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-full ${conv.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200 truncate">{conv.customerName}</span>
                    <span className="text-[10px] text-slate-600 shrink-0 ml-1">{conv.timestamp}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 pl-9">
                <p className="text-[10px] text-slate-500 truncate">{conv.lastMessage}</p>
                <StatusBadge status={conv.status} size="xs" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${activeConv?.avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
              {activeConv?.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{activeConv?.customerName}</p>
              <p className="text-[10px] text-slate-500">{activeConv?.customerId} · {activeConv?.email || 'unknown@email.com'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTicketForm(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors border border-slate-700">
              <Ticket size={12} /> Ticket
            </button>
            <button onClick={() => setShowEscalateDialog(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/30">
              <AlertTriangle size={12} /> Escalate
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConv?.messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {msg.role === 'user' ? (
                <div className={`w-7 h-7 rounded-full ${activeConv.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                  {activeConv.avatar}
                </div>
              ) : msg.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
              ) : null}
              <div className={`max-w-[75%] ${msg.role === 'system' ? 'w-full max-w-full' : ''}`}>
                {msg.role === 'system' ? (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
                    <AlertTriangle size={12} className="shrink-0" />
                    {msg.content}
                  </div>
                ) : (
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                  }`}>
                    {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)}
                  </div>
                )}
                {msg.toolsUsed && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {msg.toolsUsed.map(t => {
                      const tool = agentTools.find(a => a.id === t)
                      return tool ? (
                        <span key={t} className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-800 rounded px-1.5 py-0.5">
                          <Zap size={8} className="text-indigo-500" /> {tool.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <p className="text-[10px] text-slate-600 mt-1 px-1">{msg.timestamp}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isThinking && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
                  <span className="text-[10px] text-slate-500 ml-1">Agent thinking…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested queries */}
        {!isThinking && activeConv?.messages.length <= 2 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {suggestedQueries.slice(0, 3).map(q => (
              <button key={q} onClick={() => setInput(q)} className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-full px-3 py-1 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a customer query… (e.g. Where is order #1042?)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isThinking}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isThinking ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: tools + order */}
      <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-800 shrink-0">
          <Zap size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Agent Activity</span>
        </div>

        <div className="p-3 space-y-2">
          {/* Tool call cards */}
          {agentTools.map(tool => {
            const state = toolStates[tool.id] || 'idle'
            if (state === 'idle' && Object.keys(toolStates).length > 0) return null
            return (
              <ToolCard
                key={tool.id}
                tool={tool}
                status={state === 'idle' ? 'pending' : state}
                result={toolResults[tool.id]}
              />
            )
          })}

          {Object.keys(toolStates).length === 0 && (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2">
                <Bot size={18} className="text-slate-600" />
              </div>
              <p className="text-xs text-slate-600">Send a message to see the agent run tools in real time</p>
            </div>
          )}
        </div>

        {/* Order card */}
        {activeOrderId && orders[activeOrderId] && (
          <div className="px-3 pb-3 border-t border-slate-800 pt-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Details</p>
            <OrderCard order={orders[activeOrderId]} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setRefundTarget(orders[activeOrderId]); setShowRefundDialog(true) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
              >
                <RefreshCw size={11} /> Refund
              </button>
              <button
                onClick={() => setShowTicketForm(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 transition-colors"
              >
                <Ticket size={11} /> Ticket
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Escalate dialog */}
      {showEscalateDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-80 animate-slide-down">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Escalate to Human?</p>
                <p className="text-xs text-slate-400">This will flag the conversation</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">A human support agent will take over this conversation and contact the customer within 30 minutes.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowEscalateDialog(false)} className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={handleEscalate} className="flex-1 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500 transition-colors">Escalate Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund dialog */}
      {showRefundDialog && refundTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-80 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-100">Process Refund</p>
              <button onClick={() => setShowRefundDialog(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 mb-4">
              <p className="text-xs text-slate-500 mb-1">Refund Amount</p>
              <p className="text-2xl font-bold text-emerald-400">${refundTarget.price}</p>
              <p className="text-xs text-slate-400 mt-1">{refundTarget.item}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">→ {refundTarget.paymentMethod}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRefundDialog(false)} className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={() => { setShowRefundDialog(false); setInput(`Process refund for order #${refundTarget.id}`) }} className="flex-1 py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">Confirm Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket form */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-96 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-100">Create Support Ticket</p>
              <button onClick={() => setShowTicketForm(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Issue Description</label>
                <textarea
                  value={ticketIssue}
                  onChange={e => setTicketIssue(e.target.value)}
                  placeholder="Describe the customer issue…"
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(p => (
                    <button key={p} onClick={() => setTicketPriority(p)} className={`flex-1 py-1.5 rounded-lg text-xs capitalize font-medium transition-colors ${
                      ticketPriority === p
                        ? p === 'high' ? 'bg-red-600/30 text-red-400 border border-red-500/40'
                          : p === 'medium' ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-600/30 text-slate-300 border border-slate-500/40'
                        : 'bg-slate-700 text-slate-500 border border-slate-600 hover:bg-slate-600'
                    }`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTicketForm(false)} className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={() => { setShowTicketForm(false); setTicketIssue('') }} className="flex-1 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors">Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
