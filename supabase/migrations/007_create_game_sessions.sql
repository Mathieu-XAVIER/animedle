CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE SET NULL,
  game_mode    game_mode_enum NOT NULL,
  attempts     INT NOT NULL DEFAULT 0,
  is_won       BOOLEAN NOT NULL DEFAULT false,
  played_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX idx_game_sessions_challenge_id ON game_sessions(challenge_id);
