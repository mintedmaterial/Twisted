-- UGC Campaign: Show Us Your Twisted Gear
-- Run this against the twisted-newsletter D1 database (or keep as a migration).

CREATE TABLE IF NOT EXISTS ugc_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL UNIQUE, -- customer-facing opaque ID (e.g. ugc_abc123)
    email TEXT NOT NULL,
    email_normalized TEXT NOT NULL, -- lowercased for status lookups
    first_name TEXT,
    product_category TEXT NOT NULL, -- welder_armpad, wallet, belt, other_custom
    instagram_handle TEXT,
    tiktok_handle TEXT,
    description TEXT,
    file_key TEXT NOT NULL,          -- R2 object key (no public URL by default)
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,         -- image/* or video/* normalized prefix
    file_size INTEGER,               -- bytes
    rights_release_agreed BOOLEAN NOT NULL DEFAULT 0,
    credit_contingency_agreed BOOLEAN NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, declined
    reward_amount INTEGER,           -- dollars (25, 10, 50, null)
    reward_code TEXT,                -- unique store credit code
    reviewed_at DATETIME,
    review_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ugc_email ON ugc_submissions(email_normalized);
CREATE INDEX IF NOT EXISTS idx_ugc_status ON ugc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ugc_public_id ON ugc_submissions(public_id);

-- Optional audit/helper table: tracks codes generated so you can avoid collisions/reuse.
CREATE TABLE IF NOT EXISTS ugc_reward_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    submission_id INTEGER NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES ugc_submissions(id)
);

CREATE INDEX IF NOT EXISTS idx_ugc_codes_code ON ugc_reward_codes(code);
