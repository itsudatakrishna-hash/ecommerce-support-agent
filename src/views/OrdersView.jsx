import React, { useState } from 'react'
import { Package, Search, MapPin, Clock, CreditCard, Truck } from 'lucide-react'
import { orders } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

function OrderRow({ order, onSelect, selected }) {
  return (
    <tr
      onClick={() => onSelect(order)}
      className={`cursor-pointer transition-colors ${selected ? 'bg-indigo-600/10' : 'hover:bg-slate-800/60'}`}
    >
      <td className="px-4 py-3 text-sm font-mono text-indigo-400">#{order.id}</td>
      <td className="px-4 py-3 text-sm text-slate-200">{order.customer}</td>
      <td className="px-4 py-3 text-sm text-slate-300 max-w-[180px] truncate">{order.item}</td>
      <td className="px-4 py-3 text-sm font-medium text-slate-200">${order.price.toFixed(2)}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{order.date}</td>
      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
      <td className="px-4 py-3 text-xs text-slate-500 font-mono truncate max-w-[140px]">
        {order.tracking || '—'}
      </td>
    </tr>
  )
}

function OrderDetail({ order }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-slate-100">Order #{order.id}</p>
          <p className="text-sm text-slate-400 mt-0.5">{order.customer} · {order.customerId}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <Package size={18} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{order.item}</p>
            <p className="text-xs text-slate-500">SKU: {order.sku} · Qty: {order.quantity}</p>
          </div>
          <p className="ml-auto text-base font-bold text-slate-100">${(order.price * order.quantity).toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-0 divide-x divide-slate-700">
          {[
            { icon: Clock,      label: 'Order Date',       value: order.date },
            { icon: MapPin,     label: 'Ship To',          value: order.shippingAddress },
            { icon: CreditCard, label: 'Payment',          value: order.paymentMethod },
            { icon: Truck,      label: 'Carrier',          value: order.carrier || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3 flex items-start gap-2">
              <Icon size={13} className="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-xs text-slate-300 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {order.tracking && (
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tracking</p>
          <div className="space-y-3">
            {[
              { label: 'Order Placed',     date: order.date,              done: true },
              { label: 'Fulfillment',      date: order.date,              done: order.status !== 'processing' },
              { label: 'Shipped',          date: order.date,              done: ['in_transit', 'delivered'].includes(order.status) },
              { label: 'Out for Delivery', date: order.estimatedDelivery, done: order.status === 'delivered' },
              { label: 'Delivered',        date: order.estimatedDelivery, done: order.status === 'delivered' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${step.done ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                <span className={`text-xs ${step.done ? 'text-slate-300' : 'text-slate-600'}`}>{step.label}</span>
                {step.done && <span className="text-[10px] text-slate-600 ml-auto">{step.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersView() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const allOrders = Object.values(orders)
  const filtered = allOrders.filter(o =>
    o.id.includes(search) ||
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.item.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">Order Lookup</span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders, customers…"
              className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
              <tr>
                {['Order ID', 'Customer', 'Item', 'Total', 'Date', 'Status', 'Tracking'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(o => (
                <OrderRow key={o.id} order={o} selected={selected?.id === o.id} onSelect={setSelected} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <Package size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No orders match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-slate-800 shrink-0">
          <span className="text-sm font-semibold text-slate-200">Order Details</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selected ? (
            <OrderDetail order={selected} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Package size={32} className="mb-2 opacity-40" />
              <p className="text-sm text-center">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
