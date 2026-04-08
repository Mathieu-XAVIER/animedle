CREATE TYPE validation_status_enum AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE staging_characters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_slug        TEXT NOT NULL,
  external_id       INT NOT NULL,
  name              TEXT,
  name_kanji        TEXT,
  role_source       TEXT,
  favorites         INT DEFAULT 0,
  image_url         TEXT,
  raw_json          JSONB,
  imported_at       TIMESTAMPTZ DEFAULT now(),
  validated_at      TIMESTAMPTZ,
  validation_status validation_status_enum DEFAULT 'pending',
  UNIQUE(anime_slug, external_id)
);

CREATE INDEX idx_staging_anime_slug ON staging_characters(anime_slug);
CREATE INDEX idx_staging_validation_status ON staging_characters(validation_status);
