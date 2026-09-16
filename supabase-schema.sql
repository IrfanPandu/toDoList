-- ============================================================
-- TodoApp - Supabase Database Schema v2
-- Jalankan query ini di Supabase SQL Editor
-- Aman dijalankan berulang kali (idempotent)
-- ============================================================

-- ============================================================
-- Tabel todos (dengan fitur recurring)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.todos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  description     TEXT CHECK (char_length(description) <= 1000),
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high')),
  category        TEXT NOT NULL DEFAULT 'Lainnya',
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  -- Recurring fields
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  recur_type      TEXT CHECK (recur_type IN ('daily', 'weekly', 'monthly', 'custom', NULL)),
  recur_times     INTEGER DEFAULT NULL,        -- berapa kali per periode (NULL = unlimited)
  recur_days      INTEGER[] DEFAULT NULL,      -- hari dalam seminggu: 0=Min, 1=Sen, ..., 6=Sab
  recur_count     INTEGER NOT NULL DEFAULT 0, -- sudah berapa kali diselesaikan hari ini
  last_reset_date DATE DEFAULT NULL,          -- kapan terakhir count di-reset
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabel targets (target harian/mingguan/bulanan + reward)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.targets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  description     TEXT CHECK (char_length(description) <= 1000),
  period_type     TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  target_value    NUMERIC(12,2) NOT NULL DEFAULT 0,   -- target angka (jam, unit, dsb)
  unit            TEXT NOT NULL DEFAULT 'tugas',       -- satuan: tugas, jam, halaman, dll
  reward_amount   NUMERIC(12,2) DEFAULT NULL,          -- nominal reward/gaji jika tercapai
  reward_currency TEXT NOT NULL DEFAULT 'IDR',
  current_value   NUMERIC(12,2) NOT NULL DEFAULT 0,    -- progress saat ini
  is_achieved     BOOLEAN NOT NULL DEFAULT false,
  period_start    DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end      DATE,
  color           TEXT NOT NULL DEFAULT '#6366f1',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabel target_logs (riwayat pencapaian target)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.target_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id   UUID NOT NULL REFERENCES public.targets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_added NUMERIC(12,2) NOT NULL,
  note        TEXT,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Fungsi & Trigger auto-update kolom updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS todos_updated_at ON public.todos;
CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS targets_updated_at ON public.targets;
CREATE TRIGGER targets_updated_at
  BEFORE UPDATE ON public.targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Index
-- ============================================================

CREATE INDEX IF NOT EXISTS todos_user_id_idx       ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_created_at_idx    ON public.todos(created_at DESC);
CREATE INDEX IF NOT EXISTS todos_due_date_idx      ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS todos_is_recurring_idx  ON public.todos(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS targets_user_id_idx     ON public.targets(user_id);
CREATE INDEX IF NOT EXISTS target_logs_target_idx  ON public.target_logs(target_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.todos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_logs ENABLE ROW LEVEL SECURITY;

-- todos policies
DROP POLICY IF EXISTS "Users can view own todos"   ON public.todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;

CREATE POLICY "Users can view own todos"   ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- targets policies
DROP POLICY IF EXISTS "Users can view own targets"   ON public.targets;
DROP POLICY IF EXISTS "Users can insert own targets" ON public.targets;
DROP POLICY IF EXISTS "Users can update own targets" ON public.targets;
DROP POLICY IF EXISTS "Users can delete own targets" ON public.targets;

CREATE POLICY "Users can view own targets"   ON public.targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own targets" ON public.targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own targets" ON public.targets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own targets" ON public.targets FOR DELETE USING (auth.uid() = user_id);

-- target_logs policies
DROP POLICY IF EXISTS "Users can view own target logs"   ON public.target_logs;
DROP POLICY IF EXISTS "Users can insert own target logs" ON public.target_logs;
DROP POLICY IF EXISTS "Users can delete own target logs" ON public.target_logs;

CREATE POLICY "Users can view own target logs"   ON public.target_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own target logs" ON public.target_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own target logs" ON public.target_logs FOR DELETE USING (auth.uid() = user_id);
