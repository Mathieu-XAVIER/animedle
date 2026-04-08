INSERT INTO animes (slug, title, short_title, is_active) VALUES
  ('one-piece',    'One Piece',          'OP',  false),
  ('jjk',          'Jujutsu Kaisen',     'JJK', false),
  ('demon-slayer', 'Demon Slayer',       'DS',  false),
  ('snk',          'Shingeki no Kyojin', 'SNK', false),
  ('mha',          'My Hero Academia',   'MHA', false)
ON CONFLICT (slug) DO NOTHING;
