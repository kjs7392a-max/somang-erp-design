ALTER TABLE webauthn_credentials
  ADD COLUMN IF NOT EXISTS employee_id text;

CREATE INDEX IF NOT EXISTS webauthn_credentials_employee_id_idx
  ON webauthn_credentials (employee_id);

-- Backfill from profiles for existing rows (works if profiles.id = auth.users.id)
UPDATE webauthn_credentials wc
SET employee_id = p.employee_id
FROM profiles p
WHERE wc.user_id = p.id
  AND wc.employee_id IS NULL;
