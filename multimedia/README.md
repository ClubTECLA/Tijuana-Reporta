# multimedia

Contenedor de **almacenamiento** de archivos multimedia (fotos y videos de reportes).
Solo guarda, borra y deja los archivos en un volumen; no valida ni transforma
nada. Existe aparte del backend para que, si este contenedor falla, no arrastre
al backend: la API sigue funcionando y solo la subida de fotos y videos responde `503`.

## Visión general

```
App / Web ──► nginx :80 ──► backend :8080 ──► multimedia :8081 ──► volumen "uploads"
                               │                                   ▲  (lectura/escritura)
                               ▼                                   │
                           PostgreSQL            nginx ◄───────────┘  (solo lectura)
                       (tabla multimedia)        sirve GET /multimedia/<path>
```

| Pieza | Qué hace | Qué NO hace |
|---|---|---|
| **backend** | Expone el endpoint público, autentica, comprueba que el usuario sea el creador del reporte, valida y convierte la imagen, registra la fila en `multimedia`. | No guarda archivos en disco. |
| **multimedia** (este servicio) | Guarda el JPEG o MP4 que le manda el backend con nombre aleatorio, lo puede borrar, revisa lo guardado y aparta en cuarentena lo que el backend le pida. | No autentica, no valida lo que recibe, no convierte, no conoce la base de datos. |
| **nginx** | Enruta `/api/` al backend y sirve `/multimedia/<path>` leyendo el volumen. | No escribe en el volumen ni enruta nada hacia `multimedia`. |

## Flujo de una subida

1. La app crea el reporte: `POST /api/v1/reportes` → devuelve el `id`.
2. La app sube la foto: `POST /api/v1/reportes/{id}/multimedia` (ver [Cómo consumirlo](#cómo-consumirlo)).
3. **nginx** deja pasar hasta 12 MiB solo en esa ruta (el resto de `/api/` queda en 1 MB) y quita el prefijo `/api`.
4. **backend** (`internal/multimedia/service.go`), en este orden:
   1. Valida el JWT y que el usuario sea el **creador** del reporte (si no, `404`).
   2. Lee el archivo (máx. `MAX_FOTO_BYTES`).
   3. Detecta el tipo por **contenido**: JPEG (`FF D8 FF`) o MP4 (caja `ftyp`). Cualquier otra cosa (PNG, HEIC, `.mov`…) se rechaza.
      - **Foto:** comprueba que sea un JPEG válido y que no pase de `MAX_FOTO_BYTES` ni de `MAX_FOTO_PIXELES`.
      - **Video:** comprueba que sea un MP4 bien formado (`ftyp`, `moov` con `mvhd` y `trak`, y `mdat`), que no pase de `MAX_VIDEO_BYTES` y que dure a lo más `MAX_VIDEO_SEGUNDOS`. Rechaza los `.mov` de QuickTime y los MP4 fragmentados (duración 0).
   4. Le quita los metadatos. **Foto:** EXIF (incluido el GPS), XMP, IPTC y comentarios, sin tocar los píxeles. **Video:** las cajas `udta`, `meta` y `uuid` (a nivel de archivo, de `moov`, de cada `trak` y de cada `mdia`) se convierten en cajas `free` del mismo tamaño y con el contenido en ceros, así ningún offset se mueve y la ubicación no queda en el archivo. **No** reduce ni recomprime nada: eso lo hace la app antes de subirlo.
   5. Envía el archivo a `multimedia` (`POST /upload`, carpeta `reportes/<id>` y `extension` `jpg` o `mp4`).
   6. Inserta la fila en `multimedia`. Si falla (por ejemplo `409` por el `UNIQUE`), pide a `multimedia` borrar el archivo (`DELETE /upload/{path}`) para no dejar huérfanos.
5. **multimedia** guarda el archivo y responde su `path`; el backend lo devuelve al cliente.
6. Para verlo, el cliente pide `GET /multimedia/<path>` y **nginx** lo sirve directo del volumen.

## Cómo consumirlo

### Desde la app o la web (lo que debe hacer el frontend)

**Subir** — dos pasos, tras un solo botón "Enviar":

```
POST /api/v1/reportes                          { incidente_id, latitude, longitude }   → 201 { id, ... }   (opcionales: direccion, es_oficial)
POST /api/v1/reportes/{id}/multimedia          multipart/form-data, campo "file"       → 201 { id, path, user_id, created_at }
Authorization: Bearer <token>   (en ambas)
```

- En React Native el campo es `{ uri, name: 'foto.jpg', type: 'image/jpeg' }`. **No fijes el `Content-Type`**: `fetch` pone el boundary.
- **La app debe reducir y comprimir la foto antes de subirla**: lado largo de 1600 a 2000 px, JPEG, calidad 0.7 a 0.8, y menos de 2 MB (si pesa más, bajar la calidad y reintentar; el servidor acepta hasta 3 MiB). El servidor **no** reescala ni recomprime: solo valida (JPEG, máx. 3 MiB y 16 MP) y le quita los metadatos. Esto también convierte HEIC (iPhone) a JPEG, que el servidor rechaza.
- La app también debe dejar la **orientación corregida**: como el servidor descarta el EXIF, una foto con orientación sin corregir se verá girada.
- El paso 2 solo corre si el 1 salió bien. **Si la foto falla, el reporte ya existe**: muestra "reporte enviado, pero la foto no se pudo subir" y reintenta solo la foto con el mismo `id`. Nunca recrees el reporte (se duplicaría).

**Reglas de negocio**: solo el creador del reporte puede subir; **una foto o un video** (uno u otro) por usuario por reporte.

**Errores de la subida:**

| Código | Significado | Qué hacer |
|---|---|---|
| `201` | Guardada | Mostrar la foto con el `path` devuelto |
| `400` | Formato no soportado (solo JPEG o MP4), `.mov`, falta `file` o multipart mal armado | Avisar al usuario |
| `401` | Sin sesión o token inválido | Volver a iniciar sesión |
| `404` | El reporte no existe o el usuario no es su creador | No ofrecer subir foto a reportes ajenos |
| `409` | Ese usuario ya subió una foto o un video a ese reporte | Informar; no reintentar |
| `413` | Foto demasiado grande (máx. 3 MiB) o video demasiado grande (máx. 8 MiB) | Reducirlo antes de subir |
| `422` | Demasiados píxeles (máx. 16 MP) | Reducirla antes de subir |
| `503` | Almacenamiento caído | Reintentar solo la foto, con espera |

**Mostrar** — `GET /api/v1/reportes/{id}` trae `multimedia: [{ id, path, user_id, created_at }]`.
La URL pública es **`<origen>/multimedia/<path>`, sin `/api`**; por ejemplo
`http://localhost/multimedia/reportes/<id>/<32 hex>.jpg` (o `.mp4` si es video). Los archivos son inmutables
(nombre aleatorio que no se reutiliza), así que se pueden cachear sin límite
(`Cache-Control: immutable`). El listado del mapa (`GET /reportes`) **no** trae fotos.

El contrato completo del endpoint público está en `shared/openapi/paths/multimedia.yaml`
y sus tipos TypeScript en `shared/types/api-types.ts` (`operations["subirMultimedia"]`).

### Desde el backend (cliente de `multimedia`)

`backend/internal/almacen/cliente.go` envuelve las dos llamadas de abajo y traduce
los fallos: un error de conexión o un `5xx` de `multimedia` se convierte en
`almacen.ErrNoDisponible`, que la API responde como `503`. Se configura con
`MULTIMEDIA_URL` (en compose: `http://multimedia:8081`).

## Probar rápido

Con el stack completo levantado (`docker compose up -d --build`; la primera vez compila también el frontend web):

```bash
B=http://localhost/api/v1
E=prueba$RANDOM@t.com

# dos usuarios: el dueño del reporte y otro
curl -s $B/auth/register -H 'Content-Type: application/json' -d '{"email":"'$E'","username":"dueno","password":"Password123!"}' >/dev/null
curl -s $B/auth/register -H 'Content-Type: application/json' -d '{"email":"o'$E'","username":"otro","password":"Password123!"}' >/dev/null
T1=$(curl -s $B/auth/login -H 'Content-Type: application/json' -d '{"email":"'$E'","password":"Password123!"}' | jq -r .access_token)
T2=$(curl -s $B/auth/login -H 'Content-Type: application/json' -d '{"email":"o'$E'","password":"Password123!"}' | jq -r .access_token)

# reporte (los incidentes 1 a 7 vienen de la migración baseline)
ID=$(curl -s $B/reportes -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' -d '{"incidente_id":1,"latitude":32.5149,"longitude":-117.0382}' | jq -r .id)

subir() { curl -s -w ' -> %{http_code}\n' -X POST $B/reportes/$ID/multimedia -H "Authorization: Bearer $1" -F "file=@$2;type=${3:-image/jpeg}"; }
subir $T1 /tmp/foto.jpg          # 201 {"id":..,"path":"reportes/<id>/<hex>.jpg",...}
subir $T1 /tmp/foto.jpg          # 409: ya subió una
subir $T2 /tmp/foto.jpg          # 404: no es el creador
curl -s -X POST $B/reportes/$ID/multimedia -F "file=@/tmp/foto.jpg" -w ' -> %{http_code}\n'   # 401: sin token
```

Después:

- `curl -s $B/reportes/$ID -H "Authorization: Bearer $T1" | jq .multimedia` trae la foto.
- `http://localhost/multimedia/<path>` en el navegador la muestra.
- `docker compose exec nginx ls -R /data/uploads` lista el volumen.
- Un `.txt` o PNG, en un reporte nuevo, da `400`; con `docker compose stop multimedia` y un reporte nuevo, la subida da `503`.

## Problemas comunes

| Síntoma | Causa |
|---|---|
| `curl` imprime `000` (con `-s` no se ve el error) | El archivo de `-F "file=@RUTA"` no existe. La ruta es la del archivo en tu computadora; usa una ruta completa. |
| `Invalid format for parameter reporteId ... 'null'` | El reporte no se creó (`$ID` quedó en `null`): revisa el login y que `incidente_id` exista. |
| `GET /incidentes` da 500 con `column "etiqueta" does not exist` | La base se creó antes de que `001_baseline` agregara `etiqueta` y `direccion`. Recrea la base: `docker compose down -v && docker compose up -d --build` (borra también el volumen `uploads`). |
| `docker compose up --build` falla en `tsc -b` | Los tipos de `shared/types/api-types.ts` no cuadran con el frontend web; regenera con `pnpm generate:types` y corrige los errores de tipos. |
| `409` en la primera subida | Ese usuario ya subió una foto a ese reporte; crea otro reporte. |
| `503` | `multimedia` está caído o no responde: `docker compose ps` y `docker compose logs multimedia`. |

## API interna de `multimedia`

**No tiene autenticación. No la expongas fuera de la red de Docker** (sin `ports`
en compose, sin `location` de nginx hacia `/upload`). La autenticación y los
permisos los aplica el backend antes de llamarlo.

### `POST /upload`

`multipart/form-data` con:

| Campo | Descripción |
|---|---|
| `file` | El JPEG o MP4 ya validado y sin metadatos por el backend. Se guarda tal cual. |
| `extension` | `jpg` o `mp4`: la extensión con la que se guarda. Cualquier otro valor, o si falta, responde `400`. |
| `carpeta` | Carpeta destino dentro de `UPLOADS_DIR`, p. ej. `reportes/<reporteId>`. Solo letras, números, `-` y `_`, separados por `/`. |

El archivo se guarda con un nombre aleatorio (128 bits en hexadecimal) y la extensión pedida (`.jpg` o `.mp4`).

`201`:

```json
{ "path": "reportes/<reporteId>/<32 hex>.jpg" }
```

| Código | Cuándo |
|---|---|
| `400` | Falta `file` o `carpeta`, carpeta inválida, multipart mal formado. |
| `413` | El archivo pasa de `MAX_ARCHIVO_BYTES`. |
| `500` | Error al guardar. El detalle solo queda en el log. |

### `DELETE /upload/{path}`

Borra un archivo guardado, con el `path` que devolvió `POST /upload`. Sirve para
limpiar si el backend no pudo registrar la fila en la base de datos.

| Código | Cuándo |
|---|---|
| `204` | Borrado, o ya no existía. |
| `400` | La ruta no tiene la forma de un archivo guardado por el servicio. |
| `500` | Error al borrar. |

### `GET /archivos?desde=<RFC 3339>&hasta=<RFC 3339>`

Lista los archivos guardados cuya fecha de modificación cae entre `desde` (incluido)
y `hasta` (no incluido), y dice cuáles incumplen las reglas. Solo lee.

```json
{ "archivos": [
  { "path": "reportes/<id>/<32 hex>.jpg", "bytes": 123456 },
  { "path": "reportes/<id>/otra.png", "bytes": 99, "motivo": "nombre no generado por el servicio" }
] }
```

`motivo` solo aparece si incumple, y es el primero de: `nombre no generado por el servicio`,
`no es JPEG` (un `.jpg` que no empieza con la firma `FF D8 FF`), `no es MP4` (un `.mp4` sin caja `ftyp` en los bytes 4 a 8) o `excede el tamaño máximo` (`MAX_FOTO_BYTES` para un `.jpg`, `MAX_VIDEO_BYTES` para un `.mp4`).

| Código | Cuándo |
|---|---|
| `200` | Lista (vacía si no hay archivos). |
| `400` | Falta `desde` o `hasta`, o no son fechas RFC 3339. |
| `500` | Error al recorrer el almacén. |

### `POST /existen`

Body `{"paths": ["reportes/<id>/<32 hex>.jpg", ...]}` (máx. 1 MiB). Responde
`200 {"faltan": [...]}` con las rutas que no existen como archivo guardado. Una ruta que no
tiene la forma de un archivo guardado cuenta como faltante.

### `POST /cuarentena/{path}`

Mueve el archivo al volumen de cuarentena, conservando su ruta, y lo quita del almacén. Acepta
cualquier nombre (sirve justo para apartar archivos ajenos). Si en la cuarentena ya hay uno con
ese nombre, no lo pisa: le agrega un sufijo.

| Código | Cuándo |
|---|---|
| `204` | Movido, o ya no existía. |
| `400` | La ruta no es una ruta relativa limpia (`..`, absoluta, etc.). |
| `500` | Error al mover. |

### `DELETE /cuarentena?antes=<RFC 3339>`

Borra de la cuarentena los archivos que llegaron a ella antes de `antes`. Responde
`200 {"borrados": N}`; `400` si falta `antes` o no es una fecha válida.

### `GET /health`

`200 {"status": "ok"}`.

Todos los errores salen como `{"message": "..."}`, igual que el backend.

## Configuración

### `multimedia`

| Variable | Por defecto | Descripción |
|---|---|---|
| `MULTIMEDIA_PORT` | `8081` | Puerto. |
| `UPLOADS_DIR` | `uploads` (`/data/uploads` en la imagen) | Directorio donde se guardan los archivos. |
| `CUARENTENA_DIR` | `cuarentena` (`/data/cuarentena` en la imagen) | Directorio donde se aparta lo que no cumple las reglas. Debe quedar **fuera** de `UPLOADS_DIR`, que es lo que sirve nginx. |
| `MAX_ARCHIVO_BYTES` | `12582912` (12 MiB) | Tamaño máximo del archivo a guardar. |
| `MAX_FOTO_BYTES` | `3145728` (3 MiB) | A partir de este tamaño, `GET /archivos` marca una foto (`.jpg`) como demasiado grande. Debe coincidir con el del backend. |
| `MAX_VIDEO_BYTES` | `8388608` (8 MiB) | Lo mismo para un video (`.mp4`). Debe coincidir con el del backend. |

Un valor inválido (no numérico, cero o negativo) impide que el servicio arranque.

### Backend (límites de la foto y del video)

| Variable | Por defecto | Descripción |
|---|---|---|
| `MULTIMEDIA_URL` | `http://localhost:8081` | Dónde está `multimedia` (compose: `http://multimedia:8081`). |
| `MAX_MULTIMEDIA_BYTES` | `12582912` (12 MiB) | Tope del body de la ruta de subida. Debe coincidir con `client_max_body_size` de nginx. |
| `MAX_FOTO_BYTES` | `3145728` (3 MiB) | Tamaño máximo de la foto recibida. |
| `MAX_FOTO_PIXELES` | `16000000` | Píxeles máximos (ancho × alto). |
| `MAX_VIDEO_BYTES` | `8388608` (8 MiB) | Tamaño máximo del video recibido. Debe ser menor que `MAX_MULTIMEDIA_BYTES`. |
| `MAX_VIDEO_SEGUNDOS` | `6` | Duración máxima del video, leída de la cabecera `mvhd`. La app graba 5 s; el segundo extra es margen. |

El backend no decodifica la foto completa, solo su cabecera, ni el video, de
el que solo lee la estructura de cajas, así que no hace falta limitar cuántos se
validan a la vez.

## Archivos guardados

Los sirve nginx, no este servicio: monta el mismo volumen (`uploads`) en solo
lectura y los expone en `/multimedia/<path>`, sin listado de directorios, sin seguir
symlinks y con `X-Content-Type-Options: nosniff`. Los archivos se crean con
permisos `0644` y las carpetas con `0755` para que nginx pueda leerlos. La imagen
corre con el usuario `multimedia` (UID 10001).

## Mantenimiento diario

El backend (`backend/internal/mantenimiento`) es quien coordina; este servicio solo expone
las rutas de arriba. Todos los días a `MANTENIMIENTO_HORA` (por defecto `03:00`, en la zona
horaria `TZ` del backend; en compose, `America/Tijuana`) el backend revisa **solo lo nuevo**,
desde el último corte hasta una hora antes de ese momento (una hora para no tocar una subida
en curso). El corte se guarda en la tabla `mantenimiento_estado`, así que un reinicio o un
día sin correr no deja huecos: la siguiente pasada cubre todo lo pendiente. La primera vez
revisa las últimas 24 horas.

| Caso | Qué hace |
|---|---|
| Archivo que no corresponde a su extensión (JPEG o MP4), pasa de su límite de tamaño o tiene nombre ajeno | Lo manda a cuarentena y borra su fila de `multimedia`. |
| Archivo válido sin fila | Lo manda a cuarentena. |
| Fila sin archivo | Borra la fila. |
| Archivo en cuarentena con más de `CUARENTENA_DIAS` días | Lo borra. |

**Freno de seguridad:** si una pasada va a tocar más de `MANTENIMIENTO_MAX_ACCIONES`
archivos y filas, o la mitad o más de las filas de la ventana (con al menos 10) no tienen
archivo, no hace nada, deja un error en el log y **no avanza el corte**. Suele indicar un
volumen vacío o desmontado, o un límite mal configurado, y no archivos malos. Hay que
revisarlo a mano; la alerta se repite cada noche hasta que se resuelva.

**Reintentos:** si la pasada falla (multimedia o la base caídas, un archivo que no se pudo
apartar), el corte no avanza y se reintenta cada hora. Si falló a la mitad, lo ya
procesado no se repite y lo pendiente se completa en el reintento.

### Variables del backend

| Variable | Por defecto | Descripción |
|---|---|---|
| `MANTENIMIENTO_HORA` | `03:00` | Hora del día (HH:MM) en que corre. |
| `MANTENIMIENTO_MAX_ACCIONES` | `20` | Tope del freno de seguridad. |
| `CUARENTENA_DIAS` | `15` | Días que se conserva un archivo en la cuarentena. |
| `TZ` | `America/Tijuana` (en compose) | Zona horaria de la hora anterior. |

### Cuarentena

Es un volumen aparte (`cuarentena`) que solo monta este servicio: nginx no lo ve, así que lo
apartado deja de ser público. Para **restaurar** un archivo hay que copiarlo de vuelta a mano
al volumen `uploads` (y volver a crear su fila si hace falta); no hay ruta para eso.

```sh
docker compose exec multimedia ls -R /data/cuarentena
```

## Limitaciones conocidas

No son errores: son los límites con los que se acordó dejar esto. Cualquier implementación
futura (video, más tipos de archivo, más réplicas, subidas más estrictas) **debe tenerlos
presentes**.

- **El mantenimiento tarda hasta ~24 horas en actuar.** Un archivo inválido que se cuele
  puede estar visible en `/multimedia/...` hasta la siguiente pasada. Si no es aceptable,
  hay que agregar una pasada más frecuente o validar mejor al subir.
- **No se decodifica la imagen completa.** Hoy el backend solo lee la cabecera y quita los
  metadatos. Un JPEG con cabecera válida y píxeles corruptos, o con datos raros dentro de
  los segmentos que se conservan (por ejemplo el perfil ICC), pasa tanto la subida como el
  mantenimiento. Para cerrarlo hay que decodificar al subir (`image.Decode` en lugar de
  `DecodeConfig`, con un límite de decodificaciones simultáneas, porque cuesta CPU y
  memoria) o recodificar la imagen.
- **Las rutas internas no tienen autenticación.** Igual que `/upload`: se protegen no
  exponiendo este servicio fuera de la red de Docker. Si algún día se expone, hay que
  autenticarlas.
- **Una sola réplica del backend.** Si hubiera dos, las dos correrían el mantenimiento a la
  vez. Haría falta un candado (por ejemplo, `pg_advisory_lock`).
- **Si el backend no corre a la hora configurada**, la siguiente pasada cubre lo pendiente,
  pero un archivo inválido sigue visible entre tanto.
- **Los archivos se detectan por su fecha de modificación.** Un archivo copiado a mano con
  una fecha anterior al último corte no se revisa.
- **La cuarentena no tiene rastro en `historial`**: solo queda en el log del backend
  (`invalid file moved to quarantine`, `file without row moved to quarantine`,
  `row without file deleted`).
- **El video no se decodifica ni se revisa su códec.** Solo se valida la estructura de cajas
  MP4, la duración declarada en `mvhd` y el tamaño. Un MP4 con la estructura correcta pero
  datos corruptos, con un códec que los reproductores no soportan (HEVC en un `.mp4`) o cuya
  duración real no coincide con la declarada, pasa. La app es quien debe entregar H.264.
  Cerrarlo requiere decodificar (por ejemplo con ffmpeg) o revisar la caja `stsd`.
- **Los `.mov` se rechazan por la marca `qt  `**, aunque su contenido fuera H.264.
- **La ubicación se borra solo de las cajas `udta`, `meta` y `uuid`** (de archivo, `moov`,
  `trak` y `mdia`). La fecha de creación que declara `mvhd` y los demás datos técnicos del
  video se conservan, y lo que el códec lleve dentro de las muestras (por ejemplo mensajes
  SEI de H.264) no se toca: eso exigiría analizar el H.264.
- **Solo se aceptan pistas de video y de audio**, y cada una debe durar a lo más
  `MAX_VIDEO_SEGUNDOS` según su `mdhd`. No se revisa que haya tablas de muestras (`stbl`):
  se valida la estructura, no que el video se pueda decodificar.
- **`UPLOADS_DIR` y `CUARENTENA_DIR` no pueden ser el mismo ni estar uno dentro del otro**:
  el servicio no arranca, porque la purga de la cuarentena borraría archivos vivos.

## Desarrollo

Desde `multimedia/`:

```sh
go run ./cmd/multimedia          # levanta en :8081, guarda en ./uploads
go vet ./...
go test ./...

curl -F file=@foto.jpg -F carpeta=reportes/prueba -F extension=jpg localhost:8081/upload
```

Estructura:

| Carpeta | Contenido |
|---|---|
| `cmd/multimedia` | `main`: carga la configuración y arranca. |
| `internal/api` | Router y handlers. |
| `internal/almacenamiento` | Guardar, borrar, listar y revisar archivos dentro de `UPLOADS_DIR`, y apartarlos en la cuarentena. |
| `internal/config` | Lectura de variables de entorno. |

La validación de imágenes y la limpieza de metadatos **no** están aquí: vive en el backend
(`backend/internal/multimedia/procesamiento`), y la regla de negocio en
`backend/internal/multimedia/service.go`.

## Pendiente

- App y web: subir y reproducir video (el backend y este servicio ya lo aceptan).
- HEIC y PNG: se rechazan con `400` en el backend; la app debe exportar a JPEG.
- Ver [Limitaciones conocidas](#limitaciones-conocidas).
