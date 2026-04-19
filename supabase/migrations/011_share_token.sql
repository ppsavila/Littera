-- 011_share_token.sql
-- Add shareable link fields to essays + public read RLS policies

ALTER TABLE essays
  ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_doc_url text;

-- Ensure every existing essay has a share_token
UPDATE essays SET share_token = gen_random_uuid() WHERE share_token IS NULL;

-- Public read on shared essays (anon role)
CREATE POLICY "Public can read shared essays"
  ON essays FOR SELECT
  TO anon
  USING (is_shared = true);

-- Public read on annotations of shared essays
CREATE POLICY "Public can read annotations of shared essays"
  ON annotations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM essays e
      WHERE e.id = annotations.essay_id
        AND e.is_shared = true
    )
  );

-- Public read on error_markers of shared essays
CREATE POLICY "Public can read error_markers of shared essays"
  ON error_markers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM essays e
      WHERE e.id = error_markers.essay_id
        AND e.is_shared = true
    )
  );
