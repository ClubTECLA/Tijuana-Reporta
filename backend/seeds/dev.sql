-- =============================================================================
-- Datos de prueba SOLO PARA DESARROLLO. No va en internal/database/migrations/
-- porque `migrate up` corre en todos los entornos, incluido producción.
--
-- Requisitos: migraciones ya aplicadas (el baseline trae roles e incidentes).
-- Es re-ejecutable: usa UUIDs fijos y ON CONFLICT / WHERE NOT EXISTS.
-- Si antes aplicaste una versión anterior de este seed, haz `docker compose
-- down -v` y vuelve a levantar para no mezclar datos viejos con estos.
--
-- Los triggers hacen su trabajo solos, así que NO se escribe a mano:
--   location        -> puntos_origen (centroide) y su columna geom
--   incidente_tags  -> reporte_tag_counts y reportes_scores
--
-- Todos los usuarios son ciudadanos, con password `test1234` y sin
-- auth_providers (no hay forma de generar un token de Google en local).
--
-- USUARIOS                 UUID (último bloque)
--   1 ana_garcia           c1000000-0000-0000-0000-000000000001
--   2 luis_ramirez         c1000000-0000-0000-0000-000000000002
--   3 mariana_lopez        c1000000-0000-0000-0000-000000000003
--   4 carlos_hdz           c1000000-0000-0000-0000-000000000004
--   5 sofia_martinez       c1000000-0000-0000-0000-000000000005
--   6 jorge_torres         c1000000-0000-0000-0000-000000000006
--   7 valeria_cruz         c1000000-0000-0000-0000-000000000007
--   8 diego_flores         c1000000-0000-0000-0000-000000000008  (state Pendiente, sin actividad)
--
-- REPORTES (d0000000-0000-0000-0000-0000000000NN)   zona (coordenadas aprox.)
--   01 socavon     Pendiente   4 ubicaciones   Zona Río
--   02 luz         Probable    2               Centro
--   03 inundacion  Verificado  4               Otay
--   04 arbol       Resuelto    2  (histórico)  Playas
--   05 drenaje     Pendiente   1               La Mesa
--   06 deslave     Verificado  3               Lomas del sur
--   07 incendio    Probable    2               Otay (lote baldío)
--   08 luz         Pendiente   1               Zona Río
--   09 socavon     Descartado  2  (histórico)  Centro
--   10 inundacion  Pendiente   2               Playas
--   11 drenaje     Probable    3               Centro
--   12 socavon     Probable    2               Otay
--
-- Los reportes 01 y 12 son del mismo tipo (socavon) pero están a varios km, y
-- los puntos de cada reporte quedan a menos de ~50 m entre sí (radio = 100 m).
-- =============================================================================

-- Ayudantes para armar los UUID fijos (existen solo durante esta sesión).
CREATE OR REPLACE FUNCTION pg_temp.uid(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$$ SELECT ('c1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid $$;

CREATE OR REPLACE FUNCTION pg_temp.rid(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$$ SELECT ('d0000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid $$;

BEGIN;

-- Usuarios (todos ciudadanos) -------------------------------------------------
INSERT INTO users (id, email, phone, username, rol_id, password_hash, state)
SELECT pg_temp.uid(v.n), v.email, v.phone, v.username, r.id,
       '$2b$10$2TqwymSV2IrqToeKe9DqpOtpiXqgYmOKiHZUPmuMOuDR/1CiOWxAW',
       v.estado::user_state
FROM (VALUES
    (1, 'ana.garcia@test.com',      '6642000001', 'ana_garcia',     'Verificado'),
    (2, 'luis.ramirez@test.com',    '6642000002', 'luis_ramirez',   'Verificado'),
    (3, 'mariana.lopez@test.com',   '6642000003', 'mariana_lopez',  'Verificado'),
    (4, 'carlos.hernandez@test.com','6642000004', 'carlos_hdz',     'Verificado'),
    (5, 'sofia.martinez@test.com',  '6642000005', 'sofia_martinez', 'Verificado'),
    (6, 'jorge.torres@test.com',    '6642000006', 'jorge_torres',   'Verificado'),
    (7, 'valeria.cruz@test.com',    '6642000007', 'valeria_cruz',   'Verificado'),
    (8, 'diego.flores@test.com',    '6642000008', 'diego_flores',   'Pendiente')
) AS v(n, email, phone, username, estado)
CROSS JOIN (SELECT id FROM roles WHERE nombre = 'ciudadano') r
ON CONFLICT (id) DO NOTHING;

-- Tags por tipo de incidente (el baseline no trae ninguno) --------------------
INSERT INTO tags (incidente_id, nombre, peso)
SELECT i.id, v.nombre, v.peso
FROM (VALUES
    ('luz',        'Poste caído',          3),
    ('luz',        'Cables expuestos',     3),
    ('luz',        'Zona oscura',          1),
    ('luz',        'Falla intermitente',   1),

    ('socavon',    'Vehículo atascado',    3),
    ('socavon',    'Bloquea el paso',      2),
    ('socavon',    'Sin señalización',     2),
    ('socavon',    'Crece rápido',         3),

    ('arbol',      'Obstruye la calle',    2),
    ('arbol',      'Riesgo de caída',      3),
    ('arbol',      'Sobre cables',         3),
    ('arbol',      'Ramas rotas',          1),

    ('drenaje',    'Mal olor',             1),
    ('drenaje',    'Desborda',             3),
    ('drenaje',    'Tapa faltante',        3),
    ('drenaje',    'Aguas negras',         2),

    ('deslave',    'Bloquea la vía',       3),
    ('deslave',    'Casas en riesgo',      3),
    ('deslave',    'Material suelto',      2),
    ('deslave',    'Grietas visibles',     2),

    ('inundacion', 'Auto varado',          3),
    ('inundacion', 'Calle intransitable',  2),
    ('inundacion', 'Agua entra a casas',   3),
    ('inundacion', 'Nivel subiendo',       2),

    ('incendio',   'Vegetación',           2),
    ('incendio',   'Humo denso',           2),
    ('incendio',   'Cerca de casas',       3),
    ('incendio',   'Lote baldío',          1)
) AS v(incidente, nombre, peso)
JOIN incidentes i ON i.nombre = v.incidente
ON CONFLICT (incidente_id, nombre) DO NOTHING;

-- Reportes --------------------------------------------------------------------
-- horas = hace cuántas horas se creó. avistamientos se calcula al final.
INSERT INTO reporte (id, incidente_id, es_historico, estado_actual, created_at, updated_at)
SELECT pg_temp.rid(v.n), i.id, v.historico, v.estado::estado,
       now() - v.horas * interval '1 hour',
       now() - v.horas * interval '1 hour'
FROM (VALUES
    ( 1, 'socavon',    'Pendiente',  false,  30),
    ( 2, 'luz',        'Probable',   false,  80),
    ( 3, 'inundacion', 'Verificado', false,  50),
    ( 4, 'arbol',      'Resuelto',   true,  480),
    ( 5, 'drenaje',    'Pendiente',  false,  28),
    ( 6, 'deslave',    'Verificado', false, 100),
    ( 7, 'incendio',   'Probable',   false,  55),
    ( 8, 'luz',        'Pendiente',  false,  26),
    ( 9, 'socavon',    'Descartado', true,  290),
    (10, 'inundacion', 'Pendiente',  false,   3),
    (11, 'drenaje',    'Probable',   false,  95),
    (12, 'socavon',    'Probable',   false, 140)
) AS v(n, incidente, estado, historico, horas)
JOIN incidentes i ON i.nombre = v.incidente
ON CONFLICT (id) DO NOTHING;

-- Ubicaciones: cada usuario que reporta el mismo problema aporta un punto -----
-- (el trigger calcula el centroide en puntos_origen). `orden` espacia los
-- avistamientos 25 min entre sí, a partir de la creación del reporte.
INSERT INTO location (reporte_id, latitude, longitude, user_id, created_at)
SELECT pg_temp.rid(v.rep), v.lat, v.lng, pg_temp.uid(v.usr),
       r.created_at + v.orden * interval '25 minutes'
FROM (VALUES
    -- 01 socavon, Zona Río
    ( 1, 1, 32.52900, -117.01900, 1),
    ( 1, 2, 32.52912, -117.01893, 2),
    ( 1, 3, 32.52893, -117.01912, 3),
    ( 1, 4, 32.52905, -117.01888, 4),
    -- 02 luz, Centro
    ( 2, 2, 32.53350, -117.03850, 1),
    ( 2, 5, 32.53358, -117.03841, 2),
    -- 03 inundacion, Otay
    ( 3, 3, 32.53900, -116.96500, 1),
    ( 3, 6, 32.53911, -116.96488, 2),
    ( 3, 7, 32.53892, -116.96511, 3),
    ( 3, 1, 32.53905, -116.96493, 4),
    -- 04 arbol, Playas (histórico)
    ( 4, 4, 32.53160, -117.11900, 1),
    ( 4, 5, 32.53152, -117.11908, 2),
    -- 05 drenaje, La Mesa
    ( 5, 6, 32.51500, -116.99500, 1),
    -- 06 deslave, lomas del sur
    ( 6, 2, 32.49500, -117.02000, 1),
    ( 6, 3, 32.49510, -117.01990, 2),
    ( 6, 5, 32.49491, -117.02012, 3),
    -- 07 incendio, Otay (lote baldío)
    ( 7, 4, 32.54400, -116.97800, 1),
    ( 7, 7, 32.54408, -116.97791, 2),
    -- 08 luz, Zona Río
    ( 8, 7, 32.52650, -117.01200, 1),
    -- 09 socavon, Centro (histórico, descartado)
    ( 9, 5, 32.53100, -117.03500, 1),
    ( 9, 2, 32.53108, -117.03493, 2),
    -- 10 inundacion, Playas
    (10, 1, 32.52900, -117.11500, 1),
    (10, 4, 32.52911, -117.11489, 2),
    -- 11 drenaje, Centro
    (11, 3, 32.53450, -117.04050, 1),
    (11, 6, 32.53443, -117.04058, 2),
    (11, 7, 32.53457, -117.04043, 3),
    -- 12 socavon, Otay
    (12, 1, 32.53600, -116.97000, 1),
    (12, 7, 32.53609, -116.96991, 2)
) AS v(rep, usr, lat, lng, orden)
JOIN reporte r ON r.id = pg_temp.rid(v.rep)
WHERE NOT EXISTS (
    SELECT 1 FROM location l
    WHERE l.reporte_id = pg_temp.rid(v.rep) AND l.user_id = pg_temp.uid(v.usr)
);

-- Cada usuario queda ligado a los reportes en los que aportó una ubicación ----
INSERT INTO users_reports (user_id, reporte_id)
SELECT DISTINCT l.user_id, l.reporte_id
FROM location l
WHERE l.reporte_id::text LIKE 'd0000000-%'
ON CONFLICT (user_id, reporte_id) DO NOTHING;

-- avistamientos = número de ubicaciones de cada reporte ----------------------
UPDATE reporte r
SET avistamientos = c.n
FROM (SELECT reporte_id, count(*)::int AS n FROM location GROUP BY reporte_id) c
WHERE c.reporte_id = r.id
  AND r.id::text LIKE 'd0000000-%'
  AND r.avistamientos <> c.n;

-- Tags que los usuarios asignan a cada reporte (el trigger calcula conteos y
-- score). El tag debe pertenecer al tipo de incidente del reporte.
INSERT INTO incidente_tags (reporte_id, tag_id, added_by)
SELECT r.id, t.id, pg_temp.uid(v.usr)
FROM (VALUES
    ( 1, 'Vehículo atascado',    1),
    ( 1, 'Vehículo atascado',    2),
    ( 1, 'Bloquea el paso',      2),
    ( 1, 'Bloquea el paso',      3),
    ( 1, 'Sin señalización',     4),

    ( 2, 'Poste caído',          2),
    ( 2, 'Poste caído',          5),
    ( 2, 'Cables expuestos',     5),

    ( 3, 'Calle intransitable',  3),
    ( 3, 'Calle intransitable',  1),
    ( 3, 'Auto varado',          6),
    ( 3, 'Auto varado',          7),
    ( 3, 'Nivel subiendo',       6),

    ( 4, 'Obstruye la calle',    4),
    ( 4, 'Obstruye la calle',    5),

    ( 5, 'Mal olor',             6),

    ( 6, 'Bloquea la vía',       2),
    ( 6, 'Bloquea la vía',       5),
    ( 6, 'Casas en riesgo',      3),
    ( 6, 'Material suelto',      5),

    ( 7, 'Vegetación',           4),
    ( 7, 'Humo denso',           7),
    ( 7, 'Cerca de casas',       7),

    ( 8, 'Zona oscura',          7),

    ( 9, 'Sin señalización',     5),

    (10, 'Calle intransitable',  1),
    (10, 'Nivel subiendo',       4),

    (11, 'Tapa faltante',        3),
    (11, 'Tapa faltante',        7),
    (11, 'Desborda',             6),
    (11, 'Mal olor',             6),

    (12, 'Crece rápido',         1),
    (12, 'Vehículo atascado',    7)
) AS v(rep, tag, usr)
JOIN reporte r ON r.id = pg_temp.rid(v.rep)
JOIN tags t    ON t.incidente_id = r.incidente_id AND t.nombre = v.tag
ON CONFLICT (reporte_id, tag_id, added_by) DO NOTHING;

-- Comentarios -----------------------------------------------------------------
-- (el comentario 01/u5 es de alguien que no reportó, solo pasó por ahí)
INSERT INTO comentarios (reporte_id, user_id, comentario, created_at)
SELECT pg_temp.rid(v.rep), pg_temp.uid(v.usr), v.texto,
       now() - v.horas * interval '1 hour'
FROM (VALUES
    ( 1, 1, 'Ya hay un auto atascado, ojalá lo reparen pronto.',            22),
    ( 1, 2, 'Confirmo, lo vi esta mañana. Está frente a la plaza.',          18),
    ( 1, 3, 'Pongan señalamiento por lo menos, es peligroso de noche.',      10),
    ( 1, 5, 'Pasé por ahí hoy y sí está bastante feo.',                       4),
    ( 2, 5, 'Desde ayer no hay luz en toda la cuadra.',                      60),
    ( 3, 3, 'El agua ya llega a media llanta.',                              40),
    ( 3, 6, 'Hay dos carros varados, no pasen por aquí.',                    38),
    ( 3, 7, 'Ya bajó un poco, pero sigue difícil el paso.',                  30),
    ( 4, 4, 'Ya se llevaron el árbol, gracias.',                            430),
    ( 4, 5, 'Confirmado, la calle está libre.',                             420),
    ( 6, 2, 'Se desprendió más tierra con la lluvia de anoche.',             90),
    ( 9, 5, 'Era un bache grande, pero ya lo taparon; no era socavón.',     270),
    (11, 6, 'Huele muy fuerte desde hace días.',                             80),
    (11, 3, 'La tapa lleva semanas sin estar.',                              70),
    (12, 7, 'Se está haciendo más grande cada semana.',                     120)
) AS v(rep, usr, texto, horas)
WHERE NOT EXISTS (
    SELECT 1 FROM comentarios c
    WHERE c.reporte_id = pg_temp.rid(v.rep)
      AND c.user_id    = pg_temp.uid(v.usr)
      AND c.comentario = v.texto
);

COMMIT;