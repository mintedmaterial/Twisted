-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'website',
    is_active BOOLEAN DEFAULT 1
);

-- Promotional popup interactions table
CREATE TABLE IF NOT EXISTS popup_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    action TEXT NOT NULL,  -- 'subscribed', 'dismissed', 'closed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT
);

-- Customer information from voice agent conversations
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    phone TEXT,
    name TEXT,
    preferences TEXT,  -- JSON string for storing preferences
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation notes from voice agent
CREATE TABLE IF NOT EXISTS conversation_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    conversation_id TEXT,  -- ElevenLabs conversation ID
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Order information captured during conversations
CREATE TABLE IF NOT EXISTS conversation_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    conversation_id TEXT,
    product_type TEXT,  -- 'wallet', 'belt', 'purse', 'bible_cover', 'welding_gear'
    customization TEXT,  -- JSON string for customization details
    estimated_price REAL,
    status TEXT DEFAULT 'inquiry',  -- 'inquiry', 'quote_sent', 'ordered', 'completed'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_popup_session ON popup_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_customer ON conversation_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_conversation ON conversation_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON conversation_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_conversation ON conversation_orders(conversation_id);
