import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatView from './views/ChatView'
import OrdersView from './views/OrdersView'
import RefundsView from './views/RefundsView'
import TicketsView from './views/TicketsView'
import HistoryView from './views/HistoryView'

const VIEWS = { chat: ChatView, orders: OrdersView, refunds: RefundsView, tickets: TicketsView, history: HistoryView }

export default function App() {
  const [activeView, setActiveView] = useState('chat')
  const ActiveView = VIEWS[activeView] || ChatView

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="flex-1 overflow-hidden">
        <ActiveView onNavigate={setActiveView} />
      </main>
    </div>
  )
}
