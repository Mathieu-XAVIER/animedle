CREATE TYPE game_mode_enum AS ENUM ('classique', 'citation', 'silhouette');

CREATE TABLE daily_challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_mode      game_mode_enum NOT NULL,
  challenge_date DATE NOT NULL,
  character_id   UUID NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  quote_id       UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_mode, challenge_date)
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
