import React, { useState } from 'react'
import { Clock, MessageSquare, Zap, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { conversations } from '../data/mockData'
import { agentTools } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

export default function HistoryView({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = conversations.filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Conversation History</span>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…" className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-3">
        {filtered.map(conv => (
          <div key={conv.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/40 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-full ${conv.avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-200">{conv.customerName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={conv.status} size="xs" />
                    <span className="text-[10px] text-slate-600">{conv.timestamp}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <MessageSquare size={9} /> {conv.messages.length} messages
                  </span>
                  {conv.messages.filter(m => m.toolsUsed).flatMap(m => m.toolsUsed || [])
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 3)
                    .map(tid => {
                      const t = agentTools.find(a => a.id === tid)
                      return t ? (
                        <span key={tid} className="text-[10px] text-slate-600 flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5">
                          <Zap size={8} className="text-indigo-500" /> {t.name}
                        </span>
                      ) : null
                    })
                  }
                </div>
              </div>
              {expanded === conv.id ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
            </button>

            {expanded === conv.id && (
              <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-950/30 animate-fade-in">
                {conv.messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className={`w-6 h-6 rounded-full ${conv.avatarColor} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                        {conv.avatar}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-[9px] text-white font-bold">AI</div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[10px] text-slate-600">Session {conv.id}</span>
                  <button onClick={() => onNavigate('chat')} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                    Continue conversation →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600">
            <Clock size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No conversations match your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
