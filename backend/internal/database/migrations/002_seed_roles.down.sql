-- Revierte 002_seed_roles.up.sql

DELETE FROM roles WHERE nombre IN ('ciudadano', 'admin', 'moderador', 'analista', 'proteccion_civil', 'rescatista');
