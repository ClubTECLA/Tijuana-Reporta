CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE puntos_origen
  ADD COLUMN geom geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography
  ) STORED;

CREATE INDEX idx_puntos_origen_geom ON puntos_origen USING gist (geom);