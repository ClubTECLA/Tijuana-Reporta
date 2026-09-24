CREATE TYPE user_state AS ENUM ('Pendiente', 'En revisión', 'Verificado', 'Suspendido');

ALTER TABLE users ADD COLUMN state user_state;

ALTER TYPE estado ADD VALUE 'Oficial';

INSERT INTO roles (nombre) VALUES
    ('moderador'),
    ('analista'),
    ('proteccion_civil'),
    ('rescatista');