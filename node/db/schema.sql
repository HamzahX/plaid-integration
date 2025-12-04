-- Create items table for storing Plaid access tokens and metadata
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
    item_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'sandbox',
    institution_id VARCHAR(255),
    institution_name VARCHAR(255),
    products TEXT[],
    country_codes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_successful_update TIMESTAMP,
    error_code VARCHAR(50),
    error_message TEXT,
    deleted_at TIMESTAMP,
    UNIQUE(item_id, environment)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_item_id ON items(item_id);
CREATE INDEX IF NOT EXISTS idx_items_institution_id ON items(institution_id);
CREATE INDEX IF NOT EXISTS idx_items_environment ON items(environment);
CREATE INDEX IF NOT EXISTS idx_items_user_env ON items(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

