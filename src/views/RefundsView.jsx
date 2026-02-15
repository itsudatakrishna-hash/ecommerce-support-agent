import React, { useState } from 'react'
import { RotateCcw, CheckCircle2, Clock, X, DollarSign } from 'lucide-react'
import { refunds as initialRefunds } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

const REFUND_REASONS = [
  'Defective product',
  'Wrong item delivered',
  'Order not received',
  'Cancelled order',
  'Not as described',
  'Changed mind',
]

export default function RefundsView() {
  const [refunds, setRefunds] = useState(initialRefunds)
  const [confirmId, setConfirmId] = useState(null)
  const [newRefund, setNewRefund] = useState({ orderId: '', reason: REFUND_REASONS[0], amount: '' })
  const [showNewForm, setShowNewForm] = useState(false)

  const totalPending   = refunds.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const totalProcessed = refunds.filter(r => r.status === 'processed').reduce((s, r) => s + r.amount, 0)

  const handleProcess = (id) => {
    setRefunds(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'processed', processed: new Date().toISOString().slice(0, 10) } : r
    ))
    setConfirmId(null)
  }

  const handleCreate = () => {
    const id = `RF-44${Math.floor(Math.random() * 90) + 10}`
    setRefunds(prev => [...prev, {
      id,
      orderId: newRefund.orderId,
      customer: 'Manual Entry',
      amount: parseFloat(newRefund.amount) || 0,
      reason: newRefund.reason,
      status: 'pending',
      created: new Date().toISOString().slice(0, 10),
      processed: null,
    }])
    setNewRefund({ orderId: '', reason: REFUND_REASONS[0], amount: '' })
    setShowNewForm(false)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-emerald-400" />
          <span className="text-sm font-semibold text-slate-200">Refund Management</span>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
        >
          <RotateCcw size={12} /> New Refund
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', value: `$${totalPending.toFixed(2)}`, count: refunds.filter(r => r.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Processed', value: `$${totalProcessed.toFixed(2)}`, count: refunds.filter(r => r.status === 'processed').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Total Volume', value: `$${(totalPending + totalProcessed).toFixed(2)}`, count: refunds.length, color: 'text-slate-300', bg: 'bg-slate-800/60 border-slate-700' },
          ].map(({ label, value, count, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className={color} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-slate-600 mt-1">{count} refunds</p>
            </div>
          ))}
        </div>

        {/* Refunds table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800">
              <tr>
                {['Refund ID', 'Order', 'Customer', 'Amount', 'Reason', 'Status', 'Created', 'Action'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {refunds.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-indigo-400">{r.id}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">#{r.orderId}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{r.customer}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">${r.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{r.reason}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.created}</td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <button
                        onClick={() => setConfirmId(r.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
                      >
                        <CheckCircle2 size={10} /> Approve
                      </button>
                    )}
                    {r.status === 'processed' && (
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" /> {r.processed}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-80 animate-slide-down">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={20} className="text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-100 text-center mb-1">Approve Refund?</p>
            <p className="text-xs text-slate-400 text-center mb-5">
              Refund {confirmId} · ${refunds.find(r => r.id === confirmId)?.amount?.toFixed(2)} will be processed immediately.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={() => handleProcess(confirmId)} className="flex-1 py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* New refund form */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-96 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-100">Create Refund Request</p>
              <button onClick={() => setShowNewForm(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Order ID</label>
                <input value={newRefund.orderId} onChange={e => setNewRefund(p => ({ ...p, orderId: e.target.value }))} placeholder="e.g. 1042" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Refund Amount ($)</label>
                <input value={newRefund.amount} onChange={e => setNewRefund(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reason</label>
                <select value={newRefund.reason} onChange={e => setNewRefund(p => ({ ...p, reason: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                  {REFUND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewForm(false)} className="flex-1 py-2 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newRefund.orderId || !newRefund.amount} className="flex-1 py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
