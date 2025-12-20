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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_popup_session ON popup_interactions(session_id);
