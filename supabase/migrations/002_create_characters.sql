CREATE TYPE role_type_enum AS ENUM ('main', 'supporting', 'antagonist', 'minor');
CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE characters (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id           UUID NOT NULL REFERENCES animes(id) ON DELETE RESTRICT,
  slug               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  display_name       TEXT NOT NULL,
  gender             TEXT,
  role_type          role_type_enum,
  faction            TEXT,
  power_type         TEXT,
  weapon_type        TEXT,
  difficulty         difficulty_enum DEFAULT 'medium',
  popularity_rank    INT,
  description_short  TEXT,
  quote_ready        BOOLEAN DEFAULT false,
  silhouette_ready   BOOLEAN DEFAULT false,
  source_external_id TEXT,
  is_active          BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_characters_anime_id ON characters(anime_id);
CREATE INDEX idx_characters_is_active ON characters(is_active);
