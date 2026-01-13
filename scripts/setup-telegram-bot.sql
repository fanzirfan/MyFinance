-- =====================================================
-- MyFinance Telegram Bot Integration - Database Setup
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New query

-- 1. Create telegram_settings table
CREATE TABLE IF NOT EXISTS telegram_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  connection_token TEXT UNIQUE,
  telegram_user_id BIGINT UNIQUE,
  telegram_username TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can view own telegram settings" ON telegram_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram settings" ON telegram_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram settings" ON telegram_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Add source column to transactions table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'source'
  ) THEN
    ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'web';
  END IF;
END $$;

-- 5. Create index for faster telegram_user_id lookups
CREATE INDEX IF NOT EXISTS idx_telegram_settings_user_id ON telegram_settings(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_settings_token ON telegram_settings(connection_token);

-- =====================================================
-- IMPORTANT: After running this SQL, you also need to:
-- =====================================================
-- 1. Create a Telegram Bot via @BotFather
-- 2. Get Gemini API Key from https://aistudio.google.com/apikey
-- 3. Add these to your .env.local:
--    - TELEGRAM_BOT_TOKEN=your_bot_token
--    - TELEGRAM_WEBHOOK_SECRET=random_secret_string
--    - NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
--    - GEMINI_API_KEY=your_gemini_api_key
--    - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
-- 4. Deploy to Vercel
-- 5. Set webhook URL in Telegram:
--    curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.vercel.app/api/telegram/webhook&secret_token=<WEBHOOK_SECRET>"
