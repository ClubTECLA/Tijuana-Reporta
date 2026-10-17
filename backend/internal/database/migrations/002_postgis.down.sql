DROP INDEX IF EXISTS idx_puntos_origen_geom;
ALTER TABLE puntos_origen DROP COLUMN IF EXISTS geom;
DROP EXTENSION IF EXISTS postgis;