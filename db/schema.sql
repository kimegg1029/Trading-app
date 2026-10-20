CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY CHECK (user_id IN ('오주','혜령')),
  display_name VARCHAR(24) NOT NULL,
  avatar_data_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO user_profiles(user_id,display_name) VALUES ('오주','오주'),('혜령','혜령') ON CONFLICT(user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS exchange_credentials (
  user_id TEXT PRIMARY KEY CHECK (user_id IN ('오주','혜령')),
  access_key_ciphertext TEXT NOT NULL,
  secret_key_ciphertext TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_batches (
  id UUID PRIMARY KEY,
  requested_by TEXT NOT NULL CHECK (requested_by IN ('오주','혜령')),
  market TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('joint','solo')),
  status TEXT NOT NULL DEFAULT 'prepared',
  live BOOLEAN NOT NULL DEFAULT FALSE,
  request_json JSONB NOT NULL,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_records (
  id BIGSERIAL PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES order_batches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL CHECK (user_id IN ('오주','혜령')),
  entry_no INTEGER NOT NULL,
  market TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('bid','ask')),
  order_uuid TEXT,
  identifier TEXT NOT NULL UNIQUE,
  price NUMERIC,
  volume NUMERIC,
  funds NUMERIC,
  state TEXT NOT NULL DEFAULT 'prepared',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, user_id, entry_no, side)
);
CREATE INDEX IF NOT EXISTS order_records_created_at_idx ON order_records(created_at DESC);
CREATE INDEX IF NOT EXISTS order_records_batch_idx ON order_records(batch_id);
