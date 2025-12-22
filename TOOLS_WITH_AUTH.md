# ElevenLabs Agent Tools - With Authentication

All tools now include Bearer token authentication for security.

**IMPORTANT:** Add this to your `.env.local` (or Cloudflare Workers env vars):
```
AGENT_WEBHOOK_SECRET=twisted_agent_secret_2025_secure_key_change_in_production
```

Then add the same token to each tool's `request_headers` in the Eleven Labs dashboard.

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
      "Content-Type": "application/json",
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    }
  },
  "response_timeout_secs": 10,
  "api_schema": {
    "url": "https://twistedcustomleather.com/api/agent/customer",
    "method": "POST",
    "path_params_schema": {},
    "query_params_schema": {},
    "request_headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
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
    "method": "GET",
    "headers": {
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    }
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
    "request_headers": {
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    },
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
      "Content-Type": "application/json",
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    }
  },
  "response_timeout_secs": 10,
  "api_schema": {
    "url": "https://twistedcustomleather.com/api/agent/note",
    "method": "POST",
    "path_params_schema": {},
    "query_params_schema": {},
    "request_headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
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
      "Content-Type": "application/json",
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    }
  },
  "response_timeout_secs": 10,
  "api_schema": {
    "url": "https://twistedcustomleather.com/api/agent/order",
    "method": "POST",
    "path_params_schema": {},
    "query_params_schema": {},
    "request_headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
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
    "method": "GET",
    "headers": {
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    }
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
    "request_headers": {
      "Authorization": "Bearer twisted_agent_secret_2025_secure_key_change_in_production"
    },
    "request_body_schema": {}
  }
}
```

---

## Security Setup

### 1. Generate a strong secret key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add to Cloudflare Workers environment

```bash
npx wrangler secret put AGENT_WEBHOOK_SECRET
# Paste your generated secret when prompted
```

### 3. Update all tool definitions

Replace `twisted_agent_secret_2025_secure_key_change_in_production` with your generated secret in all 5 tool definitions above.

---

## Why Authentication?

✅ **Prevents unauthorized access** - Only your agent can call these endpoints
✅ **Protects customer data** - No one else can read/write to your database
✅ **Prevents abuse** - Rate limiting and security
✅ **Production ready** - Industry standard Bearer token auth

**Note:** The API endpoints will work without auth in development, but require it in production when `AGENT_WEBHOOK_SECRET` is set.
