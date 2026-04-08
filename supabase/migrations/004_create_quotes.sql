CREATE TABLE quotes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  quote_text   TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'fr',
  difficulty   difficulty_enum DEFAULT 'medium',
  is_spoiler   BOOLEAN DEFAULT false,
  is_active    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quotes_character_id ON quotes(character_id);
CREATE INDEX idx_quotes_is_active ON quotes(is_active);
