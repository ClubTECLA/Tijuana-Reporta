-- Tipos de incidentes por defecto. Necesario antes de poder crear reportes.

INSERT INTO incidentes (nombre, tiempo_limite, radio, esta_activo) VALUES
    ('luz', 5, 100, true),
    ('socavon', 5, 100, true),
    ('arbol', 5, 100, true),
    ('drenaje', 5, 100, true),
    ('deslave', 5, 100, true),
    ('inundacion', 5, 100, true),
    ('incendio', 5, 100, true);
