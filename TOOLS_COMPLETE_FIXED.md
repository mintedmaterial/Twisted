# ElevenLabs Agent Tools - Complete & Fixed

All tools have `api_schema` and `response_timeout_secs` required fields.

---

## Tool 1: save_customer

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
  "response_timeout_secs": 10,
  "api_schema": {
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

## Tool 2: lookup_customer

```json
{
  "type": "webhook",
  "name": "lookup_customer",
  "description": "Look up a customer's information and order history by email or phone number. Use this to check if the customer has ordered before or to retrieve their preferences.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/customer",
    "method": "GET"
  },
  "response_timeout_secs": 10,
  "api_schema": {
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

## Tool 3: save_note

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
  "response_timeout_secs": 10,
  "api_schema": {
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

## Tool 4: save_order

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
  "response_timeout_secs": 10,
  "api_schema": {
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

## Tool 5: get_order_history

```json
{
  "type": "webhook",
  "name": "get_order_history",
  "description": "Retrieve a customer's previous order history to reference past purchases or preferences.",
  "config": {
    "url": "https://twistedcustomleather.com/api/agent/order",
    "method": "GET"
  },
  "response_timeout_secs": 10,
  "api_schema": {
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

## Status

✅ All 5 tools have required fields:
- ✅ `api_schema` - Defines parameters
- ✅ `response_timeout_secs` - Set to 10 seconds
- ✅ Correct JSON syntax (lowercase `true`/`false`)
- ✅ Proper URLs (https://twistedcustomleather.com/api/agent/*)
- ✅ API endpoints deployed to production

## Deployment Status

✅ D1 database schema applied
✅ 3 API endpoints deployed:
  - /api/agent/customer (POST/GET)
  - /api/agent/note (POST)
  - /api/agent/order (POST/GET)
✅ GitHub Actions deployment successful

Just paste each tool JSON into the ElevenLabs dashboard!
