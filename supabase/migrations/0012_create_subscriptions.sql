-- Create subscriptions table (Paystack billing)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Paystack identifiers
  paystack_customer_code TEXT NOT NULL,
  paystack_subscription_code TEXT,
  paystack_authorization_code TEXT, -- for recurring charges
  paystack_email_token TEXT, -- for subscription management
  -- Plan details
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  -- Seat-based billing
  seat_count INTEGER DEFAULT 1,
  -- Payment history reference
  last_payment_at TIMESTAMPTZ,
  last_payment_amount INTEGER, -- in kobo
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One subscription per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(paystack_customer_code);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create payment_history table for audit trail
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  -- Paystack transaction details
  paystack_reference TEXT UNIQUE NOT NULL,
  paystack_transaction_id TEXT,
  -- Amount
  amount INTEGER NOT NULL, -- in kobo
  currency TEXT DEFAULT 'NGN',
  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'abandoned')),
  -- Payment method
  channel TEXT, -- card, bank, ussd, etc.
  card_type TEXT, -- visa, mastercard, etc.
  card_last4 TEXT,
  bank_name TEXT,
  -- Metadata
  metadata JSONB,
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_workspace ON payment_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_reference ON payment_history(paystack_reference);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
