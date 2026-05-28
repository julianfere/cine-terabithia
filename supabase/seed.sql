-- Seed para desarrollo local
-- Contraseña de todos los usuarios: terabithia2026

INSERT INTO users (username, password, role, display_name, created_at) VALUES
  ('admin',   '$2b$10$fmbLEv8hVFqXn6lGwxXx3e2Atd0jLlk5ORwsg6n0S5p66/O/W3psa', 'admin', 'Admin',   1700000000000),
  ('julian',  '$2b$10$fmbLEv8hVFqXn6lGwxXx3e2Atd0jLlk5ORwsg6n0S5p66/O/W3psa', 'user',  'Julian',  1700000001000),
  ('invitado','$2b$10$fmbLEv8hVFqXn6lGwxXx3e2Atd0jLlk5ORwsg6n0S5p66/O/W3psa', 'user',  'Invitado', 1700000002000)
ON CONFLICT (username) DO NOTHING;
