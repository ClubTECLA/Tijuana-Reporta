-- Revierte 004_seed_incidentes.up.sql

DELETE FROM incidentes WHERE nombre IN ('luz', 'socavon', 'arbol', 'drenaje', 'deslave', 'inundacion', 'incendio');
