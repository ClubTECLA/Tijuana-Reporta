-- Tipos de incidentes por defecto. Necesario antes de poder crear reportes.

-- Registra qué filas insertó esta migración (y no las que ya existían),
-- para que el down solo borre esas.
CREATE TABLE migration_005_seed_incidentes (
    incidente_id INTEGER PRIMARY KEY
);

WITH inserted AS (
    INSERT INTO incidentes (nombre, tiempo_limite, radio, esta_activo) VALUES
        ('luz', 5, 100, true),
        ('socavon', 5, 100, true),
        ('arbol', 5, 100, true),
        ('drenaje', 5, 100, true),
        ('deslave', 5, 100, true),
        ('inundacion', 5, 100, true),
        ('incendio', 5, 100, true)
    ON CONFLICT (nombre) DO NOTHING
    RETURNING id
)
INSERT INTO migration_005_seed_incidentes (incidente_id)
SELECT id FROM inserted;
