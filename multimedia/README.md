# multimedia

Contenedor de **almacenamiento** de archivos multimedia (hoy, fotos de reportes).
Solo guarda, borra y deja los archivos en un volumen; no valida ni transforma
nada. Existe aparte del backend para que, si este contenedor falla, no arrastre
al backend: la API sigue funcionando y solo la subida de fotos responde `503`.

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
| **multimedia** (este servicio) | Guarda el JPEG que le manda el backend con nombre aleatorio y lo puede borrar. | No autentica, no valida, no convierte, no conoce la base de datos. |
| **nginx** | Enruta `/api/` al backend y sirve `/multimedia/<path>` leyendo el volumen. | No escribe en el volumen ni enruta nada hacia `multimedia`. |

## Flujo de una subida

1. La app crea el reporte: `POST /api/v1/reportes` → devuelve el `id`.
2. La app sube la foto: `POST /api/v1/reportes/{id}/multimedia` (ver [Cómo consumirlo](#cómo-consumirlo)).
3. **nginx** deja pasar hasta 12 MiB solo en esa ruta (el resto de `/api/` queda en 1 MB) y quita el prefijo `/api`.
4. **backend** (`internal/service/multimedia.go`), en este orden:
   1. Valida el JWT y que el usuario sea el **creador** del reporte (si no, `404`).
   2. Lee el archivo (máx. `MAX_FOTO_BYTES`).
   3. Comprueba por **contenido** que sea JPEG (PNG, HEIC y demás se rechazan) y que no pase de `MAX_FOTO_PIXELES`.
   4. Le quita los metadatos (EXIF, incluido el GPS, XMP, IPTC y comentarios) sin tocar los píxeles. **No** reduce ni recomprime la foto: eso lo hace la app antes de subirla.
   5. Envía el JPEG a `multimedia` (`POST /upload`, carpeta `reportes/<id>`).
   6. Inserta la fila en `multimedia`. Si falla (por ejemplo `409` por el `UNIQUE`), pide a `multimedia` borrar el archivo (`DELETE /upload/{path}`) para no dejar huérfanos.
5. **multimedia** guarda el archivo y responde su `path`; el backend lo devuelve al cliente.
6. Para verlo, el cliente pide `GET /multimedia/<path>` y **nginx** lo sirve directo del volumen.

## Cómo consumirlo

### Desde la app o la web (lo que debe hacer el frontend)

**Subir** — dos pasos, tras un solo botón "Enviar":

```
POST /api/v1/reportes                          { incidente_id, latitude, longitude }   → 201 { id, ... }
POST /api/v1/reportes/{id}/multimedia          multipart/form-data, campo "file"       → 201 { id, path, user_id, created_at }
Authorization: Bearer <token>   (en ambas)
```

- En React Native el campo es `{ uri, name: 'foto.jpg', type: 'image/jpeg' }`. **No fijes el `Content-Type`**: `fetch` pone el boundary.
- **La app debe reducir y comprimir la foto antes de subirla**: lado largo de 1600 a 2000 px, JPEG, calidad 0.7 a 0.8, y menos de 2 MB (si pesa más, bajar la calidad y reintentar). El servidor **no** reescala ni recomprime: solo valida (JPEG, máx. 3 MiB y 16 MP) y le quita los metadatos. Esto también convierte HEIC (iPhone) a JPEG, que el servidor rechaza.
- La app también debe dejar la **orientación corregida**: como el servidor descarta el EXIF, una foto con orientación sin corregir se verá girada.
- El paso 2 solo corre si el 1 salió bien. **Si la foto falla, el reporte ya existe**: muestra "reporte enviado, pero la foto no se pudo subir" y reintenta solo la foto con el mismo `id`. Nunca recrees el reporte (se duplicaría).

**Reglas de negocio**: solo el creador del reporte puede subir; una foto por usuario por reporte.

**Errores de la subida:**

| Código | Significado | Qué hacer |
|---|---|---|
| `201` | Guardada | Mostrar la foto con el `path` devuelto |
| `400` | Formato no soportado (solo JPEG), falta `file` o multipart mal armado | Avisar al usuario |
| `401` | Sin sesión o token inválido | Volver a iniciar sesión |
| `404` | El reporte no existe o el usuario no es su creador | No ofrecer subir foto a reportes ajenos |
| `409` | Ese usuario ya subió una foto a ese reporte | Informar; no reintentar |
| `413` | Foto demasiado grande (máx. 3 MiB) | Reducirla antes de subir |
| `422` | Demasiados píxeles (máx. 16 MP, 4000×4000) | Reducirla antes de subir |
| `503` | Almacenamiento caído | Reintentar solo la foto, con espera |

**Mostrar** — `GET /api/v1/reportes/{id}` trae `multimedia: [{ id, path, user_id, created_at }]`.
La URL pública es **`<origen>/multimedia/<path>`, sin `/api`**; por ejemplo
`http://localhost/multimedia/reportes/<id>/<32 hex>.jpg`. Los archivos son inmutables
(nombre aleatorio que no se reutiliza), así que se pueden cachear sin límite
(`Cache-Control: immutable`). El listado del mapa (`GET /reportes`) **no** trae fotos.

El contrato completo del endpoint público está en `shared/openapi/paths/multimedia.yaml`
y sus tipos TypeScript en `shared/types/api-types.ts` (`operations["subirMultimedia"]`).

### Desde el backend (cliente de `multimedia`)

`backend/internal/multimedia/cliente.go` envuelve las dos llamadas de abajo y traduce
los fallos: un error de conexión o un `5xx` de `multimedia` se convierte en
`domain.ErrAlmacenNoDisponible`, que la API responde como `503`. Se configura con
`MULTIMEDIA_URL` (en compose: `http://multimedia:8081`).

## API interna de `multimedia`

**No tiene autenticación. No la expongas fuera de la red de Docker** (sin `ports`
en compose, sin `location` de nginx hacia `/upload`). La autenticación y los
permisos los aplica el backend antes de llamarlo.

### `POST /upload`

`multipart/form-data` con:

| Campo | Descripción |
|---|---|
| `file` | El JPEG ya validado y sin metadatos por el backend. Se guarda tal cual. |
| `carpeta` | Carpeta destino dentro de `UPLOADS_DIR`, p. ej. `reportes/<reporteId>`. Solo letras, números, `-` y `_`, separados por `/`. |

El archivo se guarda con un nombre aleatorio (128 bits en hexadecimal) y extensión `.jpg`.

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

### `GET /health`

`200 {"status": "ok"}`.

Todos los errores salen como `{"message": "..."}`, igual que el backend.

## Configuración

### `multimedia`

| Variable | Por defecto | Descripción |
|---|---|---|
| `MULTIMEDIA_PORT` | `8081` | Puerto. |
| `UPLOADS_DIR` | `uploads` (`/data/uploads` en la imagen) | Directorio donde se guardan los archivos. |
| `MAX_ARCHIVO_BYTES` | `12582912` (12 MiB) | Tamaño máximo del archivo a guardar. |

Un valor inválido (no numérico, cero o negativo) impide que el servicio arranque.

### Backend (límites de la foto)

| Variable | Por defecto | Descripción |
|---|---|---|
| `MULTIMEDIA_URL` | `http://localhost:8081` | Dónde está `multimedia` (compose: `http://multimedia:8081`). |
| `MAX_MULTIMEDIA_BYTES` | `12582912` (12 MiB) | Tope del body de la ruta de subida. Debe coincidir con `client_max_body_size` de nginx. |
| `MAX_FOTO_BYTES` | `3145728` (3 MiB) | Tamaño máximo de la foto recibida. |
| `MAX_FOTO_PIXELES` | `16000000` | Píxeles máximos (ancho × alto). |

El backend no decodifica la foto completa, solo su cabecera, así que no hace
falta limitar cuántas se validan a la vez.

## Archivos guardados

Los sirve nginx, no este servicio: monta el mismo volumen (`uploads`) en solo
lectura y los expone en `/multimedia/<path>`, sin listado de directorios, sin seguir
symlinks y con `X-Content-Type-Options: nosniff`. Los archivos se crean con
permisos `0644` y las carpetas con `0755` para que nginx pueda leerlos. La imagen
corre con el usuario `multimedia` (UID 10001).

## Desarrollo

Desde `multimedia/`:

```sh
go run ./cmd/multimedia          # levanta en :8081, guarda en ./uploads
go vet ./...
go test ./...

curl -F file=@foto.jpg -F carpeta=reportes/prueba localhost:8081/upload
```

Estructura:

| Carpeta | Contenido |
|---|---|
| `cmd/multimedia` | `main`: carga la configuración y arranca. |
| `internal/api` | Router y handlers. |
| `internal/almacenamiento` | Guardar y borrar archivos dentro de `UPLOADS_DIR`. |
| `internal/config` | Lectura de variables de entorno. |

La validación de imágenes y la limpieza de metadatos **no** están aquí: vive en el backend
(`backend/internal/procesamiento`), y la regla de negocio en
`backend/internal/service/multimedia.go`.

## Pendiente

- Video: el backend lo procesará y lo enviará aquí; hará falta que `multimedia` acepte otra extensión además de `.jpg`.
- HEIC y PNG: se rechazan con `400` en el backend; la app debe exportar a JPEG.
- Job de mantenimiento (después): borrar archivos huérfanos (sin fila en `multimedia`, con una antigüedad mínima) y los que pasen del límite de tamaño.
