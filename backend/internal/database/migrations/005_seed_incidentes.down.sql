-- Revierte 005_seed_incidentes.up.sql

DELETE FROM incidentes
WHERE id IN (SELECT incidente_id FROM migration_005_seed_incidentes);

DROP TABLE migration_005_seed_incidentes;
