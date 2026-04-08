CREATE TABLE character_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  image_url    TEXT NOT NULL,
  image_type   TEXT NOT NULL DEFAULT 'portrait',
  is_active    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_character_images_character_id ON character_images(character_id);
