# ElevenLabs Agent Tools - Final Correct Format

All required fields included with proper OpenAPI schema format.

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
    "url": "https://twistedcustomleather.com/api/agent/customer",
    "method": "POST",
    "path_params_schema": {},
    "query_params_schema": {},
    "request_headers": {
      "Content-Type": "application/json"
    },
    "request_body_schema": {
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
    "url": "https://twistedcustomleather.com/api/agent/customer",
    "method": "GET",
    "path_params_schema": {},
    "query_params_schema": {
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
    },
    "request_headers": {},
    "request_body_schema": {}
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
    "url": "https://twistedcustomleather.com/api/agent/note",
    "method": "POST",
    "path_params_schema": {},
    "query_params_schema": {},
    "request_headers": {
      "Content-Type": "application/json"
    },
    "request_body_schema": {
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
    "url": "https://twistedcustomleather.com/api/agent/order",
    "method": "POST",
    "path_params_schema": {},
    "query_params_schema": {},
    "request_headers": {
      "Content-Type": "application/json"
    },
    "request_body_schema": {
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
    "url": "https://twistedcustomleather.com/api/agent/order",
    "method": "GET",
    "path_params_schema": {},
    "query_params_schema": {
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
    },
    "request_headers": {},
    "request_body_schema": {}
  }
}
```

---

## What Changed

✅ Added all required `api_schema` fields:
- ✅ `url` - Full API endpoint URL
- ✅ `method` - HTTP method (POST/GET)
- ✅ `path_params_schema` - Path parameters (empty for our APIs)
- ✅ `query_params_schema` - Query parameters (for GET requests)
- ✅ `request_body_schema` - Request body (for POST requests)
- ✅ `request_headers` - HTTP headers

✅ Proper separation:
- POST tools use `request_body_schema`
- GET tools use `query_params_schema`

## Ready to Use

These tool definitions are now complete and will validate successfully in the ElevenLabs dashboard!

Copy each tool JSON and paste into: https://elevenlabs.io/app/conversational-ai → Your Agent → Tools → Add Tool
