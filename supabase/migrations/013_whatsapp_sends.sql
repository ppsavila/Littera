-- 013_whatsapp_sends.sql
-- Records every WhatsApp send attempt for idempotency and audit trail.
-- RLS: teachers can only see their own sends.

CREATE TABLE whatsapp_sends (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  essay_id    uuid REFERENCES essays(id) ON DELETE CASCADE NOT NULL,
  sent_by     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  phone_to    text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed')),
  provider    text NOT NULL DEFAULT 'zapi'
                CHECK (provider IN ('zapi', 'evolution')),
  error_msg   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for idempotency check: essay + status + recent window
CREATE INDEX whatsapp_sends_essay_status_idx
  ON whatsapp_sends (essay_id, status, sent_at DESC);

-- Index for RLS policy lookups
CREATE INDEX whatsapp_sends_sent_by_idx
  ON whatsapp_sends (sent_by);

ALTER TABLE whatsapp_sends ENABLE ROW LEVEL SECURITY;

-- Teachers can only read their own send records
CREATE POLICY "Teachers read own whatsapp_sends"
  ON whatsapp_sends FOR SELECT
  USING (auth.uid() = sent_by);

-- Teachers can insert sends (server uses service role, but policy is required)
CREATE POLICY "Teachers insert own whatsapp_sends"
  ON whatsapp_sends FOR INSERT
  WITH CHECK (auth.uid() = sent_by);
