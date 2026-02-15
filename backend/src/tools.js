import { orders, liveTickets, liveRefunds } from './mockData.js'

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'lookup_order',
      description: 'Look up order details from the database including status, item, price, tracking, and estimated delivery. Use this for any question about an order.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The numeric order ID (without the # prefix), e.g. "1042"',
          },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'process_refund',
      description: 'Initiate a refund for an order. Checks eligibility and creates a refund record. Returns a confirmation number.',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'The order ID to refund' },
          reason: { type: 'string', description: 'Reason for the refund, e.g. "defective product", "not received"' },
        },
        required: ['order_id', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_ticket',
      description: 'Create a support ticket for issues that need follow-up or cannot be resolved immediately.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          issue: { type: 'string', description: 'Brief description of the issue' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Ticket priority level' },
        },
        required: ['customer_id', 'issue', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description: 'Escalate the conversation to a human support agent when the issue is complex, the customer is frustrated, or automated resolution is not possible.',
      parameters: {
        type: 'object',
        properties: {
          conversation_id: { type: 'string', description: 'The conversation ID to escalate' },
          reason: { type: 'string', description: 'Why this needs human attention' },
        },
        required: ['conversation_id', 'reason'],
      },
    },
  },
]

export function executeToolCall(toolName, toolInput) {
  if (toolName === 'lookup_order') {
    const order = orders[toolInput.order_id]
    if (!order) {
      return { error: `Order #${toolInput.order_id} not found`, found: false }
    }
    return {
      found: true,
      order_id: order.id,
      customer: order.customer,
      customer_id: order.customerId,
      item: order.item,
      sku: order.sku,
      price: order.price,
      quantity: order.quantity,
      status: order.status,
      date: order.date,
      estimated_delivery: order.estimatedDelivery,
      tracking: order.tracking,
      carrier: order.carrier,
      shipping_address: order.shippingAddress,
      payment_method: order.paymentMethod,
      refund_eligible: order.refundEligible,
    }
  }

  if (toolName === 'process_refund') {
    const order = orders[toolInput.order_id]
    if (!order) return { success: false, error: `Order #${toolInput.order_id} not found` }
    if (!order.refundEligible) {
      return { success: false, error: `Order #${toolInput.order_id} is not eligible for a refund. Status: ${order.status}` }
    }
    const refundId = `RF-${Math.floor(Math.random() * 9000) + 1000}`
    liveRefunds.push({
      id: refundId,
      orderId: toolInput.order_id,
      customer: order.customer,
      amount: order.price * order.quantity,
      reason: toolInput.reason,
      status: 'approved',
      created: new Date().toISOString().slice(0, 10),
      processed: null,
    })
    return {
      success: true,
      refund_id: refundId,
      amount: order.price * order.quantity,
      payment_method: order.paymentMethod,
      timeline: '3–5 business days',
      status: 'approved',
    }
  }

  if (toolName === 'create_ticket') {
    const ticketId = `TK-${Math.floor(Math.random() * 9000) + 1000}`
    const ticket = {
      id: ticketId,
      customerId: toolInput.customer_id,
      customer: `Customer ${toolInput.customer_id}`,
      issue: toolInput.issue,
      priority: toolInput.priority,
      status: 'open',
      created: new Date().toISOString().slice(0, 16).replace('T', ' '),
      assignee: 'Support Team L2',
    }
    liveTickets.push(ticket)
    return {
      success: true,
      ticket_id: ticketId,
      priority: toolInput.priority,
      status: 'open',
      assignee: ticket.assignee,
    }
  }

  if (toolName === 'escalate_to_human') {
    const escalationId = `ESC-${Math.floor(Math.random() * 9000) + 1000}`
    return {
      success: true,
      escalation_id: escalationId,
      conversation_id: toolInput.conversation_id,
      reason: toolInput.reason,
      priority: 'high',
      estimated_response_time: '< 30 minutes',
      status: 'escalated',
    }
  }

  return { error: `Unknown tool: ${toolName}` }
}
