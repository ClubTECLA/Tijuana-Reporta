-- Color con el que se pinta cada tipo de incidente en el mapa, en formato
-- hexadecimal (#RRGGBB). Las filas existentes quedan con un gris neutro.
ALTER TABLE incidentes
    ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#757575'
    CONSTRAINT incidentes_color_hex_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Colores para los incidentes que siembra 005_seed_incidentes.
UPDATE incidentes AS i
SET color = c.color
FROM (VALUES
    ('luz', '#F5C518'),
    ('socavon', '#8D6E63'),
    ('arbol', '#2E7D32'),
    ('drenaje', '#00897B'),
    ('deslave', '#E65100'),
    ('inundacion', '#1E88E5'),
    ('incendio', '#D32F2F')
) AS c (nombre, color)
WHERE i.nombre = c.nombre;

-- esta_activo pasa a ser obligatorio: los incidentes sin valor se consideran
-- activos, igual que los nuevos.
UPDATE incidentes SET esta_activo = true WHERE esta_activo IS NULL;
ALTER TABLE incidentes
    ALTER COLUMN esta_activo SET DEFAULT true,
    ALTER COLUMN esta_activo SET NOT NULL;
