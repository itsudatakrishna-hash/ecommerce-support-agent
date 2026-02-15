import random
from datetime import datetime
from mock_data import orders, live_tickets, live_refunds

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "lookup_order",
            "description": (
                "Look up order details from the database including status, item, price, tracking, "
                "and estimated delivery. Use this for any question about an order."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": 'The numeric order ID (without the # prefix), e.g. "1042"',
                    }
                },
                "required": ["order_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_refund",
            "description": (
                "Initiate a refund for an order. Checks eligibility and creates a refund record. "
                "Returns a confirmation number."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The order ID to refund"},
                    "reason": {
                        "type": "string",
                        "description": 'Reason for the refund, e.g. "defective product", "not received"',
                    },
                },
                "required": ["order_id", "reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_ticket",
            "description": (
                "Create a support ticket for issues that need follow-up or cannot be resolved immediately."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Customer ID"},
                    "issue": {"type": "string", "description": "Brief description of the issue"},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Ticket priority level",
                    },
                },
                "required": ["customer_id", "issue", "priority"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": (
                "Escalate the conversation to a human support agent when the issue is complex, "
                "the customer is frustrated, or automated resolution is not possible."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "conversation_id": {
                        "type": "string",
                        "description": "The conversation ID to escalate",
                    },
                    "reason": {"type": "string", "description": "Why this needs human attention"},
                },
                "required": ["conversation_id", "reason"],
            },
        },
    },
]


def execute_tool_call(tool_name: str, tool_input: dict) -> dict:
    if tool_name == "lookup_order":
        order = orders.get(tool_input["order_id"])
        if not order:
            return {"error": f"Order #{tool_input['order_id']} not found", "found": False}
        return {
            "found": True,
            "order_id": order["id"],
            "customer": order["customer"],
            "customer_id": order["customerId"],
            "item": order["item"],
            "sku": order["sku"],
            "price": order["price"],
            "quantity": order["quantity"],
            "status": order["status"],
            "date": order["date"],
            "estimated_delivery": order["estimatedDelivery"],
            "tracking": order["tracking"],
            "carrier": order["carrier"],
            "shipping_address": order["shippingAddress"],
            "payment_method": order["paymentMethod"],
            "refund_eligible": order["refundEligible"],
        }

    if tool_name == "process_refund":
        order = orders.get(tool_input["order_id"])
        if not order:
            return {"success": False, "error": f"Order #{tool_input['order_id']} not found"}
        if not order["refundEligible"]:
            return {
                "success": False,
                "error": f"Order #{tool_input['order_id']} is not eligible for a refund. Status: {order['status']}",
            }
        refund_id = f"RF-{random.randint(1000, 9999)}"
        live_refunds.append({
            "id": refund_id,
            "orderId": tool_input["order_id"],
            "customer": order["customer"],
            "amount": order["price"] * order["quantity"],
            "reason": tool_input["reason"],
            "status": "approved",
            "created": datetime.now().strftime("%Y-%m-%d"),
            "processed": None,
        })
        return {
            "success": True,
            "refund_id": refund_id,
            "amount": order["price"] * order["quantity"],
            "payment_method": order["paymentMethod"],
            "timeline": "3-5 business days",
            "status": "approved",
        }

    if tool_name == "create_ticket":
        ticket_id = f"TK-{random.randint(1000, 9999)}"
        ticket = {
            "id": ticket_id,
            "customerId": tool_input["customer_id"],
            "customer": f"Customer {tool_input['customer_id']}",
            "issue": tool_input["issue"],
            "priority": tool_input["priority"],
            "status": "open",
            "created": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "assignee": "Support Team L2",
        }
        live_tickets.append(ticket)
        return {
            "success": True,
            "ticket_id": ticket_id,
            "priority": tool_input["priority"],
            "status": "open",
            "assignee": ticket["assignee"],
        }

    if tool_name == "escalate_to_human":
        escalation_id = f"ESC-{random.randint(1000, 9999)}"
        return {
            "success": True,
            "escalation_id": escalation_id,
            "conversation_id": tool_input["conversation_id"],
            "reason": tool_input["reason"],
            "priority": "high",
            "estimated_response_time": "< 30 minutes",
            "status": "escalated",
        }

    return {"error": f"Unknown tool: {tool_name}"}
