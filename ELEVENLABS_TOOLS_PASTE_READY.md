# ElevenLabs Agent Tools - Copy & Paste Ready

Go to: https://elevenlabs.io/app/conversational-ai
Select your agent: `agent_4901kd1hbf8keec91akr5trg8czn`
Click: **Tools** section

## ✅ Database Schema Applied

Your D1 database has been updated with:
- ✅ `customers` table
- ✅ `conversation_notes` table
- ✅ `conversation_orders` table

## Add These 5 Tools (Fixed JSON - lowercase `true`)

---

### Tool 1: Save Customer

**Click "Add Tool" → "Webhook" → Paste this:**

```json
{
  "type": "webhook",
  "name": "save_customer",
  "description": "Save or update customer contact information including name, email, phone, and preferences. Use this when a customer provides their contact details or mentions preferences about leather types, colors, or customization options.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/customer",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Customer's email address"
      },
      "phone": {
        "type": "string",
        "description": "Customer's phone number"
      },
      "name": {
        "type": "string",
        "description": "Customer's full name"
      },
      "preferences": {
        "type": "object",
        "description": "Customer preferences as JSON object"
      }
    }
  }
}
```

---

### Tool 2: Lookup Customer

**Click "Add Tool" → "Webhook" → Paste this:**

```json
{
  "type": "webhook",
  "name": "lookup_customer",
  "description": "Look up a customer's information and order history by email or phone number. Use this to check if the customer has ordered before or to retrieve their preferences.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/customer",
    "method": "GET"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Customer's email address to look up"
      },
      "phone": {
        "type": "string",
        "description": "Customer's phone number to look up"
      }
    }
  }
}
```

---

### Tool 3: Save Note

**Click "Add Tool" → "Webhook" → Paste this:**

```json
{
  "type": "webhook",
  "name": "save_note",
  "description": "Save important notes from the conversation for follow-up. Use this to record special requests, questions that need research, or callback reminders.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/note",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Customer's email if available"
      },
      "phone": {
        "type": "string",
        "description": "Customer's phone if available"
      },
      "conversation_id": {
        "type": "string",
        "description": "ElevenLabs conversation ID"
      },
      "note": {
        "type": "string",
        "description": "The note to save"
      }
    },
    "required": ["note"]
  }
}
```

---

### Tool 4: Save Order

**Click "Add Tool" → "Webhook" → Paste this:**

```json
{
  "type": "webhook",
  "name": "save_order",
  "description": "Save an order inquiry or quote request with product details and customization options. Use this when a customer expresses interest in purchasing a product.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/order",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Customer's email"
      },
      "phone": {
        "type": "string",
        "description": "Customer's phone"
      },
      "conversation_id": {
        "type": "string",
        "description": "ElevenLabs conversation ID"
      },
      "product_type": {
        "type": "string",
        "description": "Type of product: wallet, belt, purse, bible_cover, or welding_gear"
      },
      "customization": {
        "type": "object",
        "description": "Customization details as JSON"
      },
      "estimated_price": {
        "type": "number",
        "description": "Estimated price if discussed"
      },
      "notes": {
        "type": "string",
        "description": "Additional notes about the order"
      }
    },
    "required": ["product_type"]
  }
}
```

---

### Tool 5: Get Order History

**Click "Add Tool" → "Webhook" → Paste this:**

```json
{
  "type": "webhook",
  "name": "get_order_history",
  "description": "Retrieve a customer's previous order history to reference past purchases or preferences.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/order",
    "method": "GET"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Customer's email to look up orders"
      },
      "phone": {
        "type": "string",
        "description": "Customer's phone to look up orders"
      }
    }
  }
}
```

---

## Update System Prompt

Add this to your agent's system prompt:

```
## Customer Data Management

When a customer provides contact information (name, email, phone), use the save_customer tool to store it immediately.

When a customer mentions previous orders or you recognize them, use lookup_customer to retrieve their information and order history.

For important details that need follow-up, use save_note. Examples:
- Customer needs to check dimensions
- Special rush order requests
- Callback reminders
- Questions that need research

When a customer expresses interest in purchasing a product, use save_order to record:
- Product type (wallet, belt, purse, bible_cover, welding_gear)
- Customization details (tooling, initials, colors, leather type)
- Estimated pricing discussed
- Any special notes or requirements

Always confirm with the customer after saving their information: "I've saved your contact information and will make sure we follow up on that custom wallet order."
```

---

## Test the Integration

After adding all tools, test with a conversation:

1. Start a conversation with the agent
2. Say: "Hi, I'm John Smith, my email is john@test.com"
3. Say: "I'd like a bifold wallet with my initials 'JS' tooled on it"
4. Check the database to verify data was saved:

```bash
# Query customers table
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM customers ORDER BY created_at DESC LIMIT 5;"

# Query orders table
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM conversation_orders ORDER BY created_at DESC LIMIT 5;"

# Query notes table
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM conversation_notes ORDER BY created_at DESC LIMIT 5;"
```

---

## Common Issues Fixed

❌ **JSON Syntax Error at line 12**: Used `True` instead of `true`
✅ **Fixed**: All boolean values are now lowercase `true` / `false`

❌ **"Not Found" from API**: Tools endpoint may require dashboard configuration
✅ **Fixed**: Use dashboard UI to add tools with copy-paste JSON

---

## What's Ready

✅ D1 database schema applied (customers, notes, orders tables)
✅ 3 API endpoints deployed at /api/agent/*
✅ 5 tool definitions ready to paste
✅ JSON syntax corrected (lowercase `true`)
✅ Proper URL endpoints (https://twistedcustomleather.com)

Just paste each tool JSON into the dashboard and you're done!
