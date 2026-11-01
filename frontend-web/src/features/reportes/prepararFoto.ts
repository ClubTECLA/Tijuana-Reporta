// Prepara en el navegador la foto de un reporte antes de subirla (multimedia/README.md): el servidor solo
// acepta JPEG de máx. 3 MiB y 16 MP, no reescala, y descarta el EXIF (así que la orientación debe ir aplicada).

/** Archivo más grande que se intenta abrir; por encima ni se decodifica, para no congelar la pestaña. */
const MAX_INPUT_BYTES = 20 * 1024 * 1024
/** Límite del servidor para la foto ya preparada. */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
/** Valor del atributo accept del input. HEIC va también por extensión: en Windows el navegador no siempre conoce su tipo. */
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_TYPES, '.heic', '.heif'].join(',')

// HEIC (iPhone): el servidor lo rechaza, así que se convierte a JPEG aquí. Safari sabe abrirlo; Chrome y Firefox no.
const isHeic = (file: File) => /^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name)

// Lado largo de 1920 px (≈3,7 MP, muy por debajo de 16 MP) y calidad decreciente hasta pesar menos de 2 MB.
const MAX_SIDE = 1920
const TARGET_BYTES = 2 * 1024 * 1024
const QUALITIES = [0.8, 0.7, 0.6, 0.5]

export type PreparedPhoto = { blob: Blob; preview: string }

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))

const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la foto.'))
        reader.readAsDataURL(blob)
    })

/** Reduce, orienta y convierte a JPEG la foto elegida; lanza un error con el motivo si no se puede usar. */
export async function prepararFoto(file: File): Promise<PreparedPhoto> {
    if (!ACCEPTED_TYPES.includes(file.type) && !isHeic(file)) {
        throw new Error('Formato no soportado. Usa una foto JPG, PNG, WebP o HEIC.')
    }
    if (file.size > MAX_INPUT_BYTES) {
        throw new Error('La foto pesa más de 20 MB. Elige una más ligera.')
    }

    let bitmap: ImageBitmap
    try {
        // from-image aplica la orientación del EXIF antes de que se pierda al recomprimir.
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
        throw new Error(isHeic(file)
            ? 'Este navegador no puede abrir fotos HEIC. Expórtala como JPG y vuelve a elegirla.'
            : 'No se pudo abrir la foto. Prueba con otra imagen.')
    }

    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
        bitmap.close()
        throw new Error('El navegador no pudo procesar la foto.')
    }
    // Fondo blanco: JPEG no tiene transparencia y un PNG transparente saldría en negro.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    let blob: Blob | null = null
    for (const quality of QUALITIES) {
        blob = await toBlob(canvas, quality)
        if (blob && blob.size <= TARGET_BYTES) break
    }
    if (!blob || blob.size > MAX_UPLOAD_BYTES) {
        throw new Error('No se pudo reducir la foto a menos de 3 MB.')
    }

    return { blob, preview: await toDataUrl(blob) }
}
