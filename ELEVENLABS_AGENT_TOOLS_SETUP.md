# ElevenLabs Agent Tools Setup - D1 Database Integration

This guide shows you how to connect your ElevenLabs voice agent to your Cloudflare D1 database to save customer information, notes, and order details.

## Overview

The agent can now:
- **Save customer contact information** (name, email, phone)
- **Look up returning customers** and their history
- **Store conversation notes** for follow-up
- **Save order inquiries** with customization details
- **Track customer preferences** (leather type, colors, etc.)

---

## Step 1: Update Database Schema

First, apply the new database schema to add customer tracking tables.

```bash
# Navigate to your project
cd C:\Users\Minte\Desktop\dev-code\TwistedCustomLeather\tcl-app

# Apply schema to local D1 for testing
npx wrangler d1 execute twisted-newsletter --local --file=./schema.sql

# Apply schema to production D1
npx wrangler d1 execute twisted-newsletter --file=./schema.sql
```

This adds three new tables:
- `customers` - Customer contact info and preferences
- `conversation_notes` - Notes from conversations
- `conversation_orders` - Order inquiries and details

---

## Step 2: Configure Tools in ElevenLabs Dashboard

Go to https://elevenlabs.io/app/conversational-ai and select your agent (`agent_4901kd1hbf8keec91akr5trg8czn`).

Navigate to the **Tools** section and add the following three tools:

---

### Tool 1: Save Customer Information

**Tool Name:** `save_customer`

**Description:**
```
Save or update customer contact information including name, email, phone, and preferences. Use this when a customer provides their contact details or mentions preferences about leather types, colors, or customization options.
```

**Configuration:**
```json
{
  "type": "webhook",
  "method": "POST",
  "url": "https://twistedcustomleather.com/api/agent/customer",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "email": {
      "type": "string",
      "description": "Customer's email address",
      "required": false
    },
    "phone": {
      "type": "string",
      "description": "Customer's phone number",
      "required": false
    },
    "name": {
      "type": "string",
      "description": "Customer's full name",
      "required": false
    },
    "preferences": {
      "type": "object",
      "description": "Customer preferences (e.g., {\"leather_type\": \"veg tan\", \"favorite_color\": \"natural\"})",
      "required": false
    }
  }
}
```

**When to use:** When customer provides contact information or mentions preferences

**Example conversation:**
- Customer: "I'm John Smith, my email is john@example.com"
- Agent: *Calls save_customer with name and email*

---

### Tool 2: Look Up Customer

**Tool Name:** `lookup_customer`

**Description:**
```
Look up a customer's information and order history by email or phone number. Use this to check if the customer has ordered before or to retrieve their preferences.
```

**Configuration:**
```json
{
  "type": "webhook",
  "method": "GET",
  "url": "https://twistedcustomleather.com/api/agent/customer",
  "parameters": {
    "email": {
      "type": "string",
      "description": "Customer's email address to look up",
      "required": false
    },
    "phone": {
      "type": "string",
      "description": "Customer's phone number to look up",
      "required": false
    }
  }
}
```

**When to use:** At the start of conversation if customer provides contact info, or when they mention previous orders

**Example conversation:**
- Customer: "I ordered a wallet last month, my email is john@example.com"
- Agent: *Calls lookup_customer to find previous orders*

---

### Tool 3: Save Conversation Note

**Tool Name:** `save_note`

**Description:**
```
Save important notes from the conversation for follow-up. Use this to record special requests, questions that need research, or callback reminders.
```

**Configuration:**
```json
{
  "type": "webhook",
  "method": "POST",
  "url": "https://twistedcustomleather.com/api/agent/note",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "email": {
      "type": "string",
      "description": "Customer's email if available",
      "required": false
    },
    "phone": {
      "type": "string",
      "description": "Customer's phone if available",
      "required": false
    },
    "conversation_id": {
      "type": "string",
      "description": "ElevenLabs conversation ID",
      "required": false
    },
    "note": {
      "type": "string",
      "description": "The note to save",
      "required": true
    }
  }
}
```

**When to use:** For special requests, callback needs, or research required

**Example conversation:**
- Customer: "I need to check if my wife wants her initials or a custom design"
- Agent: *Calls save_note: "Customer needs to confirm with wife about personalization preference. Callback requested."*

---

### Tool 4: Save Order Inquiry

**Tool Name:** `save_order`

**Description:**
```
Save an order inquiry or quote request with product details and customization options. Use this when a customer expresses interest in purchasing a product.
```

**Configuration:**
```json
{
  "type": "webhook",
  "method": "POST",
  "url": "https://twistedcustomleather.com/api/agent/order",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "email": {
      "type": "string",
      "description": "Customer's email",
      "required": false
    },
    "phone": {
      "type": "string",
      "description": "Customer's phone",
      "required": false
    },
    "conversation_id": {
      "type": "string",
      "description": "ElevenLabs conversation ID",
      "required": false
    },
    "product_type": {
      "type": "string",
      "description": "Type of product (wallet, belt, purse, bible_cover, welding_gear)",
      "required": true
    },
    "customization": {
      "type": "object",
      "description": "Customization details (e.g., {\"tooling\": \"floral\", \"initials\": \"JS\", \"color\": \"natural\"})",
      "required": false
    },
    "estimated_price": {
      "type": "number",
      "description": "Estimated price if discussed",
      "required": false
    },
    "notes": {
      "type": "string",
      "description": "Additional notes about the order",
      "required": false
    }
  }
}
```

**When to use:** When customer wants to order or requests a quote

**Example conversation:**
- Customer: "I'd like a bifold wallet with my initials 'JS' tooled on it"
- Agent: *Calls save_order with product_type: "wallet", customization: {"style": "bifold", "initials": "JS", "tooling": true}*

---

### Tool 5: Get Order History

**Tool Name:** `get_order_history`

**Description:**
```
Retrieve a customer's previous order history to reference past purchases or preferences.
```

**Configuration:**
```json
{
  "type": "webhook",
  "method": "GET",
  "url": "https://twistedcustomleather.com/api/agent/order",
  "parameters": {
    "email": {
      "type": "string",
      "description": "Customer's email to look up orders",
      "required": false
    },
    "phone": {
      "type": "string",
      "description": "Customer's phone to look up orders",
      "required": false
    }
  }
}
```

**When to use:** When customer mentions previous orders or to check for repeat customers

---

## Step 3: Update Agent System Prompt

Add this to your agent's system prompt to guide when to use these tools:

```
## Customer Data Management

When a customer provides contact information (name, email, phone), use the save_customer tool to store it immediately.

When a customer mentions previous orders or you recognize them, use lookup_customer to retrieve their information and order history. This helps provide personalized service.

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

## Step 4: Test the Integration

### Local Testing

```bash
# Start your dev server
npm run dev

# Test the API endpoints directly
curl -X POST http://localhost:3000/api/agent/customer \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test Customer", "phone": "555-1234"}'

curl -X POST http://localhost:3000/api/agent/note \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "note": "Customer wants floral tooling on belt"}'

curl -X POST http://localhost:3000/api/agent/order \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "product_type": "wallet", "customization": {"initials": "TC"}}'
```

### Production Testing

Once deployed, test with your voice agent:

1. Start a conversation with the agent
2. Provide contact information: "Hi, I'm John at john@test.com"
3. Ask about a product: "I want a custom wallet with my initials"
4. Check the database to see if data was saved:

```bash
# Query the database
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM customers ORDER BY created_at DESC LIMIT 5;"
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM conversation_orders ORDER BY created_at DESC LIMIT 5;"
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM conversation_notes ORDER BY created_at DESC LIMIT 5;"
```

---

## Step 5: View Customer Data

### Query Customer Information

```bash
# Get all customers
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM customers;"

# Get specific customer
npx wrangler d1 execute twisted-newsletter --command "SELECT * FROM customers WHERE email = 'customer@example.com';"

# Get customer with orders
npx wrangler d1 execute twisted-newsletter --command "
  SELECT c.*, o.product_type, o.customization, o.created_at as order_date
  FROM customers c
  LEFT JOIN conversation_orders o ON c.id = o.customer_id
  WHERE c.email = 'customer@example.com';
"
```

### Build a Dashboard (Optional Future Enhancement)

You could create an admin dashboard at `/admin` to view:
- Recent conversations
- Customer list with order history
- Pending orders/inquiries
- Conversation notes that need follow-up

---

## R2 Integration (Optional)

For saving files like custom design images or photos customers send:

### Add R2 Binding to wrangler.toml

```toml
[[r2_buckets]]
binding = "CUSTOMER_FILES"
bucket_name = "twisted-customer-files"
```

### Create File Upload Endpoint

```typescript
// src/app/api/agent/upload/route.ts
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const r2 = env.CUSTOMER_FILES as R2Bucket;

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const customerId = formData.get('customer_id') as string;

  const key = `customers/${customerId}/${Date.now()}_${file.name}`;
  await r2.put(key, file.stream());

  return NextResponse.json({ success: true, file_url: key });
}
```

### Add Upload Tool to Agent

```json
{
  "type": "webhook",
  "method": "POST",
  "url": "https://twistedcustomleather.com/api/agent/upload",
  "description": "Upload customer design files or images"
}
```

---

## Troubleshooting

### Tools Not Showing Up
- Make sure you're on the correct agent in the dashboard
- Refresh the page after adding tools
- Check that URLs are correct (https://twistedcustomleather.com)

### Tools Not Being Called
- Review agent conversation logs to see if tools were attempted
- Check system prompt includes guidance on when to use tools
- Verify API endpoints are working (test with curl)

### Database Errors
- Ensure schema was applied: `npx wrangler d1 execute twisted-newsletter --file=./schema.sql`
- Check D1 binding in wrangler.toml matches deployed worker
- Review logs: `npx wrangler tail`

---

## Benefits

With these tools, your agent can now:

1. **Provide personalized service** - Recognize returning customers
2. **Capture leads automatically** - Every inquiry saves to database
3. **Enable follow-up** - Sales team can see all conversation notes
4. **Track preferences** - Remember customer's favorite leather types, colors
5. **Build customer database** - Automated CRM from voice conversations
6. **Generate quotes** - Know exactly what customers want
7. **Improve over time** - Learn from conversation patterns

---

## Next Steps

1. **Apply database schema** (Step 1)
2. **Configure all 5 tools** in ElevenLabs dashboard (Step 2)
3. **Update system prompt** with tool usage guidance (Step 3)
4. **Test in production** with real conversations (Step 4)
5. **Monitor database** to see customer data being saved (Step 5)
6. **(Optional) Add R2 for file uploads** if customers send design images

Your voice agent will now automatically build a customer database while helping customers!
