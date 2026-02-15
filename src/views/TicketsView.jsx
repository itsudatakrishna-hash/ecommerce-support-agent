import React, { useState } from 'react'
import { Ticket, Plus, Search, User, Clock, Filter, X } from 'lucide-react'
import { tickets as initialTickets } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['open', 'in_progress', 'resolved']

export default function TicketsView() {
  const [tickets, setTickets] = useState(initialTickets)
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState({ customer: '', issue: '', priority: 'medium' })

  const filtered = tickets.filter(t => {
    const matchSearch = t.customer.toLowerCase().includes(search.toLowerCase()) || t.issue.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchPriority && matchStatus
  })

  const handleCreate = () => {
    const newTicket = {
      id: `TK-${Math.floor(Math.random() * 900) + 9900}`,
      customerId: `C-${Math.floor(Math.random() * 9000) + 1000}`,
      customer: form.customer || 'Unknown Customer',
      issue: form.issue,
      priority: form.priority,
      status: 'open',
      created: new Date().toISOString().slice(0, 16).replace('T', ' '),
      assignee: 'Support Team L1',
    }
    setTickets(prev => [newTicket, ...prev])
    setForm({ customer: '', issue: '', priority: 'medium' })
    setShowNewForm(false)
  }

  const handleStatusChange = (id, status) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">Support Tickets</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-1.5 py-0.5 ml-1">
              {tickets.filter(t => t.status === 'open').length} open
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…" className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48" />
            </div>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
              <option value="all">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button onClick={() => setShowNewForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 transition-colors">
              <Plus size={12} /> New Ticket
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
              <tr>
                {['Ticket ID', 'Customer', 'Issue', 'Priority', 'Status', 'Created', 'Assignee'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(t => (
                <tr key={t.id} onClick={() => setSelected(t)} className={`cursor-pointer transition-colors ${selected?.id === t.id ? 'bg-amber-600/10' : 'hover:bg-slate-800/60'}`}>
                  <td className="px-4 py-3 text-xs font-mono text-amber-400">{t.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{t.customer}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate">{t.issue}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{t.created}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <Ticket size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No tickets match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
            <span className="text-sm font-semibold text-slate-200">{selected.id}</span>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <StatusBadge status={selected.priority} />
              <p className="text-sm font-semibold text-slate-200 mt-2">{selected.issue}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><User size={10} /> {selected.customer}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Clock size={10} /> {selected.created}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Update Status</p>
              <div className="space-y-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected.id, s)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${selected.status === s ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
                    <span className="capitalize">{s.replace('_', ' ')}</span>
                    {selected.status === s && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Assignee</p>
              <p className="text-xs text-slate-300">{selected.assignee}</p>
            </div>
          </div>
        </div>
      )}

      {/* New ticket form */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-96 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-100">New Support Ticket</p>
              <button onClick={() => setShowNewForm(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Customer Name</label>
                <input value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} placeholder="e.g. John Smith" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Issue Description</label>
                <textarea value={form.issue} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))} placeholder="Describe the issue…" rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))} className={`flex-1 py-1.5 rounded-lg text-xs capitalize font-medium transition-colors border ${
                      form.priority === p
                        ? p === 'high' ? 'bg-red-600/20 text-red-400 border-red-500/40' : p === 'medium' ? 'bg-amber-600/20 text-amber-400 border-amber-500/40' : 'bg-slate-600/20 text-slate-300 border-slate-500/40'
                        : 'bg-slate-700 text-slate-500 border-slate-600 hover:bg-slate-600'
                    }`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewForm(false)} className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!form.issue.trim()} className="flex-1 py-2 rounded-lg text-sm text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-40 transition-colors">Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
