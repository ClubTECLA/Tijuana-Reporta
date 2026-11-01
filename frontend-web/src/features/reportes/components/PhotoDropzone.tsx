import { useState, type DragEvent } from "react";
import { LuImage, LuLoaderCircle, LuX } from "react-icons/lu";
import { ACCEPT_ATTRIBUTE } from "@/features/reportes/prepararFoto";
import { useSysMessage } from "@/components/ui/SysMessageContext";

interface PhotoDropzoneProps {
    /** Vista previa de la foto ya preparada (data URL); sin ella se muestra la zona para elegir. */
    preview?: string | null
    /** Se está reduciendo la foto elegida. */
    busy?: boolean
    disabled?: boolean
    onSelect: (file: File) => void
    onRemove: () => void
}

// "Subir fotos" del Figma, con una sola foto: el backend admite una por usuario por reporte.
// Los límites reales (formato y peso) los valida prepararFoto al elegirla; aquí solo se recoge el archivo.
export default function PhotoDropzone({ preview, busy = false, disabled = false, onSelect, onRemove }: PhotoDropzoneProps) {
    const [dragging, setDragging] = useState(false);
    const { showMessage } = useSysMessage();

    if (preview) {
        return (
            // shrink-0: dentro de la columna con scroll del formulario, un elemento con overflow-hidden tiene altura
            // mínima 0 y se encoge (hasta desaparecer) cuando el contenido no cabe, en vez de hacer scroll.
            <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-line bg-subtle">
                <img src={preview} alt="Foto del incidente" className="size-full object-cover" />
                <button
                    type="button"
                    aria-label="Quitar foto"
                    onClick={onRemove}
                    disabled={disabled}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-surface text-icon shadow-raised transition hover:brightness-95 disabled:opacity-60"
                >
                    <LuX className="size-4" />
                </button>
            </div>
        );
    }

    const inactive = disabled || busy;
    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        const { files } = event.dataTransfer;
        if (!files[0] || inactive) return;
        // Al hacer clic el selector solo deja elegir una; al arrastrar pueden llegar varias.
        if (files.length > 1) {
            showMessage("Solo se puede subir una foto: se usa la primera y las demás se ignoran.", { color: "yellow", type: "float", title: "Foto" });
        }
        onSelect(files[0]);
    };

    return (
        <label
            onDragOver={(event) => { event.preventDefault(); if (!inactive) setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
                flex w-full flex-col items-center gap-1.5 rounded-2xl
                border border-dashed p-4.5 text-center
                ${dragging ? 'border-brand bg-brand-subtle' : 'border-line-strong bg-subtle'}
                ${inactive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-line-soft/60'}
            `}
        >
            <input
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                disabled={inactive}
                className="sr-only"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    // Se vacía para que volver a elegir el mismo archivo también dispare onChange.
                    event.target.value = "";
                    if (file) onSelect(file);
                }}
            />
            {busy
                ? <LuLoaderCircle className="size-6 animate-spin text-brand-text" />
                : <LuImage className="size-6 text-brand-text" />}
            <span className="text-sm font-semibold text-brand-text">
                {busy ? "Preparando foto…" : "Arrastra una foto o haz clic para subir"}
            </span>
            <span className="text-xs text-ink-muted">JPG, PNG, WebP o HEIC · se reduce al subirla (máx. 20 MB)</span>
        </label>
    );
}
