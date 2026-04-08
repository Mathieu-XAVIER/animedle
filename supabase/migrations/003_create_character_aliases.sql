CREATE TABLE character_aliases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  alias            TEXT NOT NULL,
  normalized_alias TEXT NOT NULL
);

CREATE INDEX idx_character_aliases_character_id ON character_aliases(character_id);
CREATE INDEX idx_character_aliases_normalized ON character_aliases(normalized_alias);
