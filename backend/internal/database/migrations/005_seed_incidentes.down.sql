-- Revierte 005_seed_incidentes.up.sql

DELETE FROM incidentes AS i
WHERE i.id IN (SELECT incidente_id FROM migration_005_seed_incidentes)
AND NOT EXISTS (
SELECT 1
FROM reporte AS r
WHERE r.incidente_id = i.id);
  
DROP TABLE migration_005_seed_incidentes;
