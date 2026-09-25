-- Revierte 001_init_schema.up.sql

DROP TRIGGER IF EXISTS trg_update_reporte_ubicacion ON location;
DROP FUNCTION IF EXISTS update_reporte_ubicacion();

DROP TRIGGER IF EXISTS trg_update_tag_counts ON incidente_tags;
DROP FUNCTION IF EXISTS update_tag_counts();

DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS users_reports;
DROP TABLE IF EXISTS historial;
DROP TABLE IF EXISTS notificaciones_counts;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS acciones;
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS reportes_scores;
DROP TABLE IF EXISTS reporte_tag_counts;
DROP TABLE IF EXISTS incidente_tags;
DROP TABLE IF EXISTS fotos_reportes;
DROP TABLE IF EXISTS puntos_origen;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS reporte;
DROP TYPE IF EXISTS estado;
DROP TABLE IF EXISTS auth_providers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS incidentes;