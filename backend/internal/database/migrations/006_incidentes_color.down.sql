-- Revierte 006_incidentes_color.up.sql

ALTER TABLE incidentes
    ALTER COLUMN esta_activo DROP NOT NULL,
    ALTER COLUMN esta_activo DROP DEFAULT;

ALTER TABLE incidentes DROP COLUMN IF EXISTS color;
