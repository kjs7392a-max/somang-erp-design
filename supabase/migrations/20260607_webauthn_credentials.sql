CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id   text        NOT NULL UNIQUE,
  public_key      text        NOT NULL,
  counter         bigint      NOT NULL DEFAULT 0,
  device_name     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz
);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS webauthn_credentials_user_id_idx
  ON webauthn_credentials (user_id);
