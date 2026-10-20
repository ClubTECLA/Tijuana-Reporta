-- =============================================================================
-- Verifica que el seed (dev.sql) quedó cargado completo. Solo lee, no modifica.
-- Cuenta únicamente filas del seed (por el prefijo de sus UUID), salvo `tags`,
-- que no tiene marcador: si agregas tags por otro lado, saldrá DIFERENTE.
-- =============================================================================

\echo
\echo '== 1) Conteos esperados vs. actuales =='
SELECT tabla, esperado, actual,
       CASE WHEN esperado = actual THEN 'OK' ELSE 'DIFERENTE' END AS estado
FROM (
    SELECT 1 AS ord, 'users' AS tabla, 8 AS esperado,
           (SELECT count(*) FROM users WHERE id::text LIKE 'c1000000-%') AS actual
    UNION ALL SELECT 2, 'tags', 28, 
       (SELECT count(*)
              FROM tags tg
              JOIN incidentes inc ON inc.id = tg.incidente_id
              JOIN (VALUES
                     ('luz','Poste caído'),            ('luz','Cables expuestos'),
                     ('luz','Zona oscura'),            ('luz','Falla intermitente'),
                     ('socavon','Vehículo atascado'),  ('socavon','Bloquea el paso'),
                     ('socavon','Sin señalización'),   ('socavon','Crece rápido'),
                     ('arbol','Obstruye la calle'),    ('arbol','Riesgo de caída'),
                     ('arbol','Sobre cables'),         ('arbol','Ramas rotas'),
                     ('drenaje','Mal olor'),           ('drenaje','Desborda'),
                     ('drenaje','Tapa faltante'),      ('drenaje','Aguas negras'),
                     ('deslave','Bloquea la vía'),     ('deslave','Casas en riesgo'),
                     ('deslave','Material suelto'),    ('deslave','Grietas visibles'),
                     ('inundacion','Auto varado'),     ('inundacion','Calle intransitable'),
                     ('inundacion','Agua entra a casas'), ('inundacion','Nivel subiendo'),
                     ('incendio','Vegetación'),        ('incendio','Humo denso'),
                     ('incendio','Cerca de casas'),    ('incendio','Lote baldío')
              ) AS seed(incidente, nombre)
                ON seed.incidente = inc.nombre AND seed.nombre = tg.nombre)
    UNION ALL SELECT 3, 'reporte', 12,
           (SELECT count(*) FROM reporte WHERE id::text LIKE 'd0000000-%')
    UNION ALL SELECT 4, 'location', 28,
           (SELECT count(*) FROM location WHERE reporte_id::text LIKE 'd0000000-%')
    UNION ALL SELECT 5, 'puntos_origen (trigger)', 12,
           (SELECT count(*) FROM puntos_origen WHERE reporte_id::text LIKE 'd0000000-%')
    UNION ALL SELECT 6, 'incidente_tags', 33,
           (SELECT count(*) FROM incidente_tags WHERE reporte_id::text LIKE 'd0000000-%')
    UNION ALL SELECT 7, 'reportes_scores (trigger)', 12,
           (SELECT count(*) FROM reportes_scores WHERE reporte_id::text LIKE 'd0000000-%')
    UNION ALL SELECT 8, 'comentarios', 15,
           (SELECT count(*) FROM comentarios WHERE reporte_id::text LIKE 'd0000000-%')
    UNION ALL SELECT 9, 'users_reports', 28,
           (SELECT count(*) FROM users_reports WHERE reporte_id::text LIKE 'd0000000-%')
) t
ORDER BY ord;

\echo
\echo '== 2) Resumen por reporte =='
SELECT right(r.id::text, 2)                  AS rep,
       i.nombre                              AS tipo,
       r.estado_actual                       AS estado,
       (SELECT count(*) FROM location l       WHERE l.reporte_id = r.id) AS ubic,
       (SELECT count(*) FROM incidente_tags t WHERE t.reporte_id = r.id) AS votos_tag,
       (SELECT count(*) FROM comentarios c    WHERE c.reporte_id = r.id) AS coment,
       coalesce(s.total_score, 0)            AS score,
       round(p.latitude::numeric, 5)         AS lat_centro,
       round(p.longitude::numeric, 5)        AS lng_centro
FROM reporte r
JOIN incidentes i         ON i.id = r.incidente_id
LEFT JOIN puntos_origen p ON p.reporte_id = r.id
LEFT JOIN reportes_scores s ON s.reporte_id = r.id
WHERE r.id::text LIKE 'd0000000-%'
ORDER BY r.id;

\echo
\echo '== 3) Usuarios del seed =='
SELECT u.username, ro.nombre AS rol, u.state,
       (SELECT count(*) FROM location l    WHERE l.user_id = u.id) AS ubic,
       (SELECT count(*) FROM comentarios c WHERE c.user_id = u.id) AS coment
FROM users u
JOIN roles ro ON ro.id = u.rol_id
WHERE u.id::text LIKE 'c1000000-%'
ORDER BY u.username;