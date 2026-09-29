-- Roles por defecto. Necesario antes de poder insertar en users, cuyo
-- rol_id es NOT NULL REFERENCES roles(id) y la tabla arranca vacía.

INSERT INTO roles (nombre) VALUES
    ('ciudadano'),
    ('admin'),
    ('moderador'),
    ('analista'),
    ('proteccion_civil'),
    ('rescatista');
