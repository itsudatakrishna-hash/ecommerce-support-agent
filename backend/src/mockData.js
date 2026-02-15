export const orders = {
  '1042': {
    id: '1042', customer: 'Sarah Mitchell', customerId: 'C-8821', email: 'sarah.m@email.com',
    item: 'Sony WH-1000XM5 Headphones', sku: 'SON-WH5-BLK', price: 349.99, quantity: 1,
    status: 'in_transit', date: '2026-06-01', estimatedDelivery: '2026-06-10',
    tracking: 'UPS-1Z999AA10123456784', carrier: 'UPS',
    shippingAddress: '142 Maple Drive, Portland, OR 97201', paymentMethod: 'Visa ****4892',
    refundEligible: true,
  },
  '1038': {
    id: '1038', customer: 'James Thornton', customerId: 'C-5510', email: 'jthornton@gmail.com',
    item: 'Apple iPad Pro 11" (M4)', sku: 'APL-IPP11-256-SLV', price: 999.00, quantity: 1,
    status: 'delivered', date: '2026-05-28', estimatedDelivery: '2026-06-02',
    tracking: 'FEDEX-274899101264', carrier: 'FedEx',
    shippingAddress: '88 Ocean Blvd, Miami, FL 33101', paymentMethod: 'Mastercard ****7731',
    refundEligible: true,
  },
  '1055': {
    id: '1055', customer: 'Priya Nair', customerId: 'C-9934', email: 'priya.nair@work.io',
    item: 'Standing Desk Electric 60"', sku: 'DSK-ELT-60-OAK', price: 529.00, quantity: 1,
    status: 'processing', date: '2026-06-07', estimatedDelivery: '2026-06-14',
    tracking: null, carrier: 'Freight',
    shippingAddress: '310 Tech Park Rd, Austin, TX 78701', paymentMethod: 'PayPal',
    refundEligible: false,
  },
  '1019': {
    id: '1019', customer: 'Carlos Rivera', customerId: 'C-3302', email: 'crivera@outlook.com',
    item: 'Logitech MX Keys S Keyboard', sku: 'LOG-MXS-GRY', price: 109.99, quantity: 2,
    status: 'returned', date: '2026-05-15', estimatedDelivery: '2026-05-20',
    tracking: 'USPS-9400111899223344556', carrier: 'USPS',
    shippingAddress: '55 Sunset Ave, Chicago, IL 60601', paymentMethod: 'Visa ****2201',
    refundEligible: false,
  },
  '1067': {
    id: '1067', customer: 'Emily Chen', customerId: 'C-7712', email: 'emily.chen@design.co',
    item: 'Dell UltraSharp 27" 4K Monitor', sku: 'DEL-U2723D-BLK', price: 749.99, quantity: 1,
    status: 'cancelled', date: '2026-06-05', estimatedDelivery: null,
    tracking: null, carrier: null,
    shippingAddress: '900 Creative Lane, Brooklyn, NY 11201', paymentMethod: 'AmEx ****3388',
    refundEligible: true,
  },
}

export const tickets = [
  { id: 'TK-9821', customerId: 'C-9934', customer: 'Priya Nair', issue: 'Order #1055 delayed shipment', priority: 'high', status: 'open', created: '2026-06-09 09:21', assignee: 'Logistics Team' },
  { id: 'TK-9814', customerId: 'C-8821', customer: 'Sarah Mitchell', issue: 'Wrong item delivered in order #1041', priority: 'medium', status: 'in_progress', created: '2026-06-08 14:33', assignee: 'Support Agent L2' },
  { id: 'TK-9800', customerId: 'C-5510', customer: 'James Thornton', issue: 'iPad screen defect — return initiated', priority: 'low', status: 'resolved', created: '2026-06-07 10:12', assignee: 'Returns Team' },
]

export const conversations = [
  {
    id: 'conv-001', customerId: 'C-8821', customerName: 'Sarah Mitchell',
    lastMessage: 'Where is my order #1042?', status: 'pending', timestamp: '2 min ago',
    messages: [
      { role: 'user', content: 'Hi, where is my order #1042?', timestamp: '10:22 AM' },
    ],
  },
  {
    id: 'conv-002', customerId: 'C-5510', customerName: 'James Thornton',
    lastMessage: 'Refund processed for #1038', status: 'resolved', timestamp: '18 min ago',
    messages: [
      { role: 'user', content: 'I want to return my iPad Pro.', timestamp: '9:55 AM' },
      { role: 'assistant', content: 'Refund initiated for order #1038.', timestamp: '9:56 AM' },
    ],
  },
]

// Simulated in-memory state for created tickets and refunds
export const liveTickets = [...tickets]
export const liveRefunds = []
export const liveConversations = [...conversations]
