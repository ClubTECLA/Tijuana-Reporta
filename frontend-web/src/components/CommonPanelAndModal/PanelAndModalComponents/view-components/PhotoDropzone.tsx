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
                border border-dashed border-[#cbd5e1] bg-[#f1f5f9] p-4.5 text-center
                ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-200/60'}
            `}
        >
            <input type="file" accept="image/jpeg,image/png" multiple disabled={disabled} className="sr-only" />
            <LuImage className="size-6 text-[#176edf]" />
            <span className="text-sm font-semibold text-[#176edf]">Arrastra fotos o haz clic para subir</span>
            <span className="text-xs text-[#64748b]">JPG o PNG · máximo 5 MB por foto</span>
        </label>
    );
}
