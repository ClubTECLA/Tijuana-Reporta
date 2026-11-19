# Guía: modelo de riesgo

Esta guía explica de dónde salen los datos de la funcionalidad de riesgo (pantalla
"Riesgo e histórico" del panel web), cómo se calcula el peso de cada reporte y qué
falta definir. El código vive en `internal/riesgo/`; los datos, en la vista
`reporte_historico_peso` (migración `002_riesgo`).

**Versión del modelo:** 1.

---

## Qué es y qué no es

El riesgo muestra **cómo se han comportado los incidentes a lo largo del tiempo**:
dónde se concentran, en qué colonias y de qué tipo. Responde a los requerimientos
F-4 (zonas más propensas a tener incidentes, basadas en la información histórica) y
+6 (un riesgo calculado no se presenta como un incidente confirmado).

| | Incidentes | Riesgo |
|---|---|---|
| Datos | Reportes activos (`NOT es_historico`) | Reportes históricos (`es_historico`) |
| Pregunta | ¿Qué está pasando ahora? | ¿Dónde y qué ha pasado más? |
| Tiempo | En vivo (sondeo) | Periodo elegido (`desde` / `hasta`) |

Por eso un reporte nunca aparece en las dos: mientras está activo es de Incidentes y,
cuando se archiva como histórico, pasa a contar para el riesgo.

---

## Fuente de datos

Todas las consultas leen la vista `reporte_historico_peso`. Es la única puerta a los
datos del riesgo, así que ninguna consulta puede mezclar por error reportes activos o
descartados. Contiene un registro por reporte que cumple:

- `reporte.es_historico = true`, y
- `estado_actual <> 'Descartado'`: el riesgo usa solo información válida
  (requerimiento R-10).

| Columna | De dónde sale |
|---|---|
| `reporte_id`, `incidente_id`, `created_at` | `reporte` |
| `geom` | `puntos_origen.geom`: el centroide de las ubicaciones del reporte |
| `colonia` | La parte después de ` · ` en `reporte.direccion` (`"calle · colonia"`); `NULL` si no hay |
| `peso` | Ver [Peso de un reporte](#peso-de-un-reporte) |

**Quién marca un reporte como histórico:** cualquier rol distinto de `ciudadano`, a
mano, con `PUT /reportes/{id}/historico` (y `DELETE` para devolverlo a Incidentes).
Es idempotente y queda en el `historial` (`reporte.marcar_historico` /
`reporte.desmarcar_historico`). Todavía no hay un paso automático (p. ej. al
resolverse o al vencer `tiempo_limite`); la tabla `logs` del baseline sigue sin usarse
y es la alternativa si se prefiere guardar una foto inmutable al archivar.

---

## Peso de un reporte

```
peso = credibilidad(estado) × (1 + ln(1 + avistamientos))
```

| Estado | Credibilidad | Por qué |
|---|---|---|
| Verificado | 1.0 | Confirmado |
| Resuelto | 1.0 | Ocurrió: que ya se haya resuelto no cambia lo que dice del lugar |
| Probable | 0.75 | Tuvo confirmaciones, pero no se verificó |
| Pendiente | 0.5 | Nadie lo confirmó; aporta, con menos peso |
| Descartado | — | No entra en la vista |

- **Avistamientos con logaritmo:** el primer avistamiento sube el factor de 1 a ≈ 1.7,
  pero el décimo aporta mucho menos; así un solo reporte muy visto no tapa una zona con
  muchos reportes. Con 2 avistamientos el factor es ≈ 2.1; con 6, ≈ 2.9.
- **`es_oficial` no multiplica:** un aviso oficial nace verificado, así que ya tiene
  la credibilidad máxima.
- **Sin recencia:** un reporte de 2019 pesa lo mismo que uno de 2026. El tiempo se
  acota con el periodo que pide el cliente.
- **No usa la severidad de los tags** (`reportes_scores.total_score`): crece cuando la
  gente confirma tags, la misma señal que los avistamientos, y se contaría dos veces.

---

## Mapa de calor

`ListCeldasCalor` agrupa los reportes del área visible en una cuadrícula y devuelve,
por celda, la suma de los pesos y cuántos reportes cayeron en ella.

- La cuadrícula es en metros reales: `geom` se proyecta a UTM zona 11N (EPSG:32611,
  la de Tijuana) y `ST_SnapToGrid` lleva cada punto al nodo más cercano, que queda
  como el centro de la celda.
- El filtro por área (`&&` sobre `geography`) usa el índice GiST de
  `puntos_origen.geom`.
- **Áreas anchas:** en `geography` los bordes del rectángulo son arcos de círculo
  máximo. Con 180° o más de longitud se interpreta al revés (0 filas), y con
  exactamente 180° PostGIS falla ("Antipodal edge"). Pasa con el mapa muy alejado.
  Por eso el servicio parte el área en tramos de a lo más 90° (`PartirArea`), hace
  una consulta por tramo y junta por su centro las celdas que salen en dos tramos.
  El área de la ciudad queda en un solo tramo.
- El área llega siempre en longitudes de -180 a 180 (lo exige el contrato). El web
  convierte las de las copias del mundo que repite MapLibre al desplazarse, y si la
  vista cruza el antimeridiano pide todas las longitudes.
- **Tamaño de celda según el zoom:** unos 32 px en pantalla. A la latitud de Tijuana
  un píxel mide ≈ 132 030 / 2^zoom metros, así que la celda es
  `132 030 / 2^zoom × 32` m, limitada a [50 m, 5 km]: ≈ 4.1 km en zoom 10, 516 m en
  zoom 13 y 64 m en zoom 16. Así la densidad visual es la misma en cualquier zoom.
- `peso_maximo` es el mayor peso entre las celdas devueltas; el cliente lo usa para
  normalizar la intensidad del calor.

## Histórico por colonia

`ListColoniasHistorico` devuelve las colonias con más peso en el periodo (las 10
primeras). Los reportes sin colonia no entran en esta lista, pero sí en el mapa de
calor, las zonas y los totales. El nombre se toma tal cual de la dirección (sin
espacios sobrantes): dos escrituras distintas de la misma colonia cuentan por separado.

## Conteo por categoría

`ListConteoCategorias` cuenta los reportes por tipo de incidente; la suma es el total
de históricos del periodo. El nombre y el color de cada tipo los pone el cliente desde
el catálogo (`GET /incidentes`).

## Zonas de riesgo

`ListZonasRiesgo` agrupa los reportes históricos cercanos entre sí con DBSCAN
(`ST_ClusterDBSCAN`, sobre UTM 11N para trabajar en metros). Un reporte forma zona si
tiene al menos `min_puntos` reportes (contándose a sí mismo) a menos de `eps_m` metros;
los reportes aislados quedan como ruido y no forman zona, pero sí cuentan en el mapa de
calor, el histórico y los totales.

| Parámetro | Valor | Por qué |
|---|---|---|
| `eps_m` | 500 m | Del tamaño de una colonia (radios de 180 a 600 m con los datos reales). Con 1 km las zonas se encadenan (hasta 3 km de radio). |
| `min_puntos` | 4 | Cuatro incidentes cercanos ya son un patrón; con 3 se cuentan como zona repeticiones del mismo punto. |

Los dos llegan como parámetros de la consulta (constantes `EpsM` y `MinPuntos` del
servicio), así que se ajustan sin migración. Se calibraron con los 415 históricos
reales (lluvias de Baja California):

| eps / mín. | Zonas | Reportes sueltos |
|---|---|---|
| 300 m / 5 | 12 | 322 |
| **500 m / 4** | 25 | 234 |
| 300 m / 3 | 37 | 240 |
| 1000 m / 5 | 19 | 184 (zonas de hasta 3 km) |

Se devuelven las 20 zonas de más peso.

Por cada zona se devuelve:

- **Centro:** el centroide de sus reportes.
- **Radio:** el percentil 90 de la distancia de sus reportes al centro. El círculo
  cubre dónde se concentran; un reporte aislado en el borde no lo infla.
- **Colonia:** la más frecuente entre sus reportes. Si ninguno tiene colonia, la
  consulta devuelve `''` y la zona se nombra "Zona sin colonia": sigue siendo riesgo
  real y no se oculta.
- **Reportes y peso:** cuántos reportes y la suma de sus pesos. El orden es por peso.

DBSCAN corre sobre todos los históricos del periodo en cada consulta del resumen. Con
miles de reportes es rápido; si crece mucho, es el lugar para precalcular las zonas.

### Círculos o polígonos

El Figma dibuja las zonas como círculos y así se implementan. La alternativa es
devolver el contorno de la zona como polígono:
`ST_Buffer(ST_ConcaveHull(puntos, 0.4), 60)` simplificado con
`ST_SimplifyPreserveTopology`, en GeoJSON. Con los datos de prueba cada polígono
tiene entre 10 y 24 vértices (menos de 1 KB). Sigue mejor la forma real de una zona
alargada (un canal, una avenida), pero requiere agregar un campo de geometría al
contrato y dibujarlo como capa `fill`/`line` en el mapa.

## Score y nivel

El `score` de una zona o colonia es su peso dividido entre el mayor peso de la lista
devuelta (0 a 1, redondeado a 4 decimales). Es relativo: la zona más pesada del
periodo y filtro elegidos siempre vale 1.

| Nivel | Score |
|---|---|
| Alto | ≥ 0.66 |
| Medio | ≥ 0.33 |
| Bajo | < 0.33 |

`zonas_alto_riesgo` cuenta las zonas en Alto. Al ser relativo se ajusta solo a
cualquier filtro; la contra es que siempre habrá algo en Alto aunque haya pocos datos
(por eso el panel muestra también el número de reportes).

## Quién lo ve

`GET /riesgo/mapa-calor` y `GET /riesgo/resumen` son para todos los roles menos
`ciudadano`: admin, moderador, analista, proteccion_civil y rescatista.

---

## Cómo cambiar el modelo

- **La fórmula del peso** está en la vista: se cambia con una migración nueva
  (`CREATE OR REPLACE VIEW reporte_historico_peso ...`), nunca editando la `002`.
- **Cualquier cambio** en pesos, umbrales o parámetros sube la versión del modelo
  (`version_modelo` en la respuesta) y se anota en esta guía.

## Fuera de alcance por ahora

Lo muestra el Figma, pero no hay datos o no se ha definido:

- Factores de lluvia, pendiente del terreno y estado del drenaje; personas en la zona.
- Recalcular el modelo bajo demanda o con una frecuencia fija (hoy se calcula en cada
  consulta).
- Ajustar pesos desde la web, exportar datos y alertar a Protección Civil.
