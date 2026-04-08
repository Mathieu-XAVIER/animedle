CREATE TABLE admin_import_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_slug   TEXT NOT NULL,
  imported     INT NOT NULL DEFAULT 0,
  skipped      INT NOT NULL DEFAULT 0,
  errors       JSONB DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'success',
  created_at   TIMESTAMPTZ DEFAULT now()
);
