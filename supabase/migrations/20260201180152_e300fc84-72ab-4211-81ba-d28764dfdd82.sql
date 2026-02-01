-- FlashAsset Database Schema
-- Stores transaction records, analytics, and audit logs for the hybrid blockchain approach

-- Transactions table - stores all token operations
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('mint', 'burn', 'transfer')),
  token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDT', 'BTC', 'ETH')),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  expiry_timestamp BIGINT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used TEXT,
  gas_price TEXT,
  chain_id INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  indexed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Token holders snapshot - updated periodically from on-chain data
CREATE TABLE public.token_holders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDT', 'BTC', 'ETH')),
  balance TEXT NOT NULL DEFAULT '0',
  expiry_timestamp BIGINT,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, token_symbol)
);

-- Daily analytics aggregates
CREATE TABLE public.daily_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDT', 'BTC', 'ETH')),
  volume TEXT NOT NULL DEFAULT '0',
  transaction_count INTEGER NOT NULL DEFAULT 0,
  mint_count INTEGER NOT NULL DEFAULT 0,
  burn_count INTEGER NOT NULL DEFAULT 0,
  transfer_count INTEGER NOT NULL DEFAULT 0,
  active_holders INTEGER NOT NULL DEFAULT 0,
  new_holders INTEGER NOT NULL DEFAULT 0,
  chain_id INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, token_symbol, chain_id)
);

-- Admin action logs for audit trail
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_address TEXT NOT NULL,
  action TEXT NOT NULL,
  target_address TEXT,
  token_symbol TEXT,
  amount TEXT,
  details JSONB,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System sync state - tracks blockchain indexing progress
CREATE TABLE public.sync_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id INTEGER NOT NULL UNIQUE,
  last_block_number BIGINT NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_syncing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_transactions_tx_hash ON public.transactions(tx_hash);
CREATE INDEX idx_transactions_from_address ON public.transactions(from_address);
CREATE INDEX idx_transactions_to_address ON public.transactions(to_address);
CREATE INDEX idx_transactions_token_symbol ON public.transactions(token_symbol);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_type_symbol ON public.transactions(tx_type, token_symbol);

CREATE INDEX idx_token_holders_wallet ON public.token_holders(wallet_address);
CREATE INDEX idx_token_holders_symbol ON public.token_holders(token_symbol);
CREATE INDEX idx_token_holders_expired ON public.token_holders(is_expired) WHERE is_expired = false;

CREATE INDEX idx_daily_analytics_date ON public.daily_analytics(date DESC);
CREATE INDEX idx_daily_analytics_symbol ON public.daily_analytics(token_symbol);

CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_address);
CREATE INDEX idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- Enable Row Level Security (public read, authenticated write for edge functions)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (analytics and transaction data is public)
CREATE POLICY "Public read access for transactions"
ON public.transactions FOR SELECT
USING (true);

CREATE POLICY "Public read access for token_holders"
ON public.token_holders FOR SELECT
USING (true);

CREATE POLICY "Public read access for daily_analytics"
ON public.daily_analytics FOR SELECT
USING (true);

-- Admin logs are read-only for public
CREATE POLICY "Public read access for admin_logs"
ON public.admin_logs FOR SELECT
USING (true);

-- Sync state is read-only for public
CREATE POLICY "Public read access for sync_state"
ON public.sync_state FOR SELECT
USING (true);

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can insert/update token_holders"
ON public.token_holders FOR ALL
USING (true);

CREATE POLICY "Service role can insert daily_analytics"
ON public.daily_analytics FOR ALL
USING (true);

CREATE POLICY "Service role can insert admin_logs"
ON public.admin_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can manage sync_state"
ON public.sync_state FOR ALL
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_token_holders_updated_at
BEFORE UPDATE ON public.token_holders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_state_updated_at
BEFORE UPDATE ON public.sync_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for transaction updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;