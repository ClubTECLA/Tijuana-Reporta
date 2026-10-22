import { LuImage } from "react-icons/lu";

interface PhotoDropzoneProps {
    disabled?: boolean
}

// "Subir fotos" del Figma. Solo la interfaz: el backend aún no tiene endpoint para subir archivos
// (multimedia solo acepta una ruta ya existente), así que de momento se muestra deshabilitada.
export default function PhotoDropzone({ disabled = false }: PhotoDropzoneProps) {
    return (
        <label
            title={disabled ? "Próximamente" : undefined}
            className={`
                flex w-full flex-col items-center gap-1.5 rounded-2xl
                border border-dashed border-line-strong bg-subtle p-4.5 text-center
                ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-line-soft/60'}
            `}
        >
            <input type="file" accept="image/jpeg,image/png" multiple disabled={disabled} className="sr-only" />
            <LuImage className="size-6 text-brand-text" />
            <span className="text-sm font-semibold text-brand-text">Arrastra fotos o haz clic para subir</span>
            <span className="text-xs text-ink-muted">JPG o PNG · máximo 5 MB por foto</span>
        </label>
    );
}
