import React from 'react'

const config = {
  resolved:    { label: 'Resolved',    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  pending:     { label: 'Pending',     classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  escalated:   { label: 'Escalated',  classes: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  in_transit:  { label: 'In Transit', classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  delivered:   { label: 'Delivered',  classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  processing:  { label: 'Processing', classes: 'bg-violet-500/15 text-violet-400 border border-violet-500/30' },
  returned:    { label: 'Returned',   classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' },
  cancelled:   { label: 'Cancelled',  classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' },
  open:        { label: 'Open',       classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  processed:   { label: 'Processed',  classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  high:        { label: 'High',       classes: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  medium:      { label: 'Medium',     classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  low:         { label: 'Low',        classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = config[status] || { label: status, classes: 'bg-slate-700 text-slate-400' }
  const sz = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sz} ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}
