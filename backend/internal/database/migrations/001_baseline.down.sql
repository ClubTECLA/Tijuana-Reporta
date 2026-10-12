-- Borra todo el esquema (tablas, funciones y tipos) y con él los datos.

DROP TABLE
    acciones,
    auth_providers,
    comentarios,
    multimedia,
    historial,
    incidente_tags,
    incidentes,
    location,
    logs,
    notificaciones,
    notificaciones_counts,
    puntos_origen,
    refresh_tokens,
    reporte,
    reporte_tag_counts,
    reportes_scores,
    roles,
    tags,
    users,
    users_reports;

DROP FUNCTION update_puntos_origen();
DROP FUNCTION update_tag_counts();

DROP TYPE estado;
DROP TYPE user_state;
