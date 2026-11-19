import { useState } from "react";
import Button from "@/components/ui/Button";
import SubSection from "@/components/layout/SubSection";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import { eliminarIncidente } from "@/features/categorias/incidentes.services";
import type { ApiIncidente } from "@/types/api-types";
import useModals from "@/panels/useModals";
import { MdDeleteForever } from "react-icons/md";

interface DeleteIncidentConfirmationProps {
    incident: Pick<ApiIncidente, "id" | "nombre">;
    onDeleted: (incidentId: number) => void;
}

export default function DeleteIncidentConfirmation({
    incident,
    onDeleted,
}: DeleteIncidentConfirmationProps) {
    const { closeModal } = useModals();
    const { showMessage } = useSysMessage();
    const [ deleting, setDeleting ] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);

        try {
            await eliminarIncidente(incident.id);
            onDeleted(incident.id);
            closeModal();
            showMessage("Incidente eliminado correctamente.", {
                color: "green",
                showTime: 3000,
                title: "Incidente eliminado",
                type: "float",
            });
        } catch (error) {
            console.error("Error al eliminar incidente:", error);
            showMessage("No se pudo eliminar el incidente.", {
                color: "red",
                showTime: 3000,
                title: "Error",
                type: "float",
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <SubSection
            as="div"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-incident-title"
            className="w-[min(26rem,calc(100vw-2rem))] gap-4 p-5 flex-col"
        >
            <div className="flex flex-col gap-2">
                <h2 id="delete-incident-title" className="text-lg font-bold text-ink">Eliminar incidente</h2>
                <p className="text-sm text-ink-muted">
                    ¿Seguro que quieres eliminar “{incident.nombre}”? Esta acción no se puede deshacer.
                </p>
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    title="Cancelar"
                    disabled={deleting}
                    onClick={closeModal}
                />
                <Button
                    title={deleting ? "Eliminando..." : "Eliminar"}
                    icon={<MdDeleteForever />}
                    variant="danger"
                    disabled={deleting}
                    onClick={handleDelete}
                />
            </div>
        </SubSection>
    );
}
