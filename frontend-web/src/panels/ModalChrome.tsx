import { createElement, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { modalRegistry } from "./modalRegistry";
import type { ModalViewKey, ModalViewProps } from "./modalTypes";
import useModals from "./useModals";

interface ModalChromeProps {
    fullFocus?: boolean;
}

function renderModal<K extends ModalViewKey>(view: K, props: ModalViewProps<K>) {
    const ModalView = modalRegistry[view] as ComponentType<object>;
    return createElement(ModalView, props);
}

export default function ModalChrome({ fullFocus }: ModalChromeProps) {
    const { modal, position, setPosition } = useModals();
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const modalPosAtStart = useRef({ x: 0, y: 0 });
    const shouldFullFocus = fullFocus ?? modal?.fullFocus ?? false;

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

        // Capturar el puntero permite continuar el arrastre aunque el cursor salga del control.
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        modalPosAtStart.current = { ...position };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        setPosition({
            x: modalPosAtStart.current.x + e.clientX - dragStartPos.current.x,
            y: modalPosAtStart.current.y + e.clientY - dragStartPos.current.y,
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        setIsDragging(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    if (!modal) return null;

    return createPortal(
        <>
            {shouldFullFocus && (
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-[59] bg-black/20 backdrop-blur-sm"
                />
            )}
            <section
                style={{
                    transform: shouldFullFocus
                        ? `translate3d(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px), 0)`
                        : `translate3d(${position.x}px, ${position.y}px, 0)`,
                }}
                className={`
                    fixed z-[60] w-fit pointer-events-auto
                    flex flex-col items-center justify-center
                    rounded-xl bg-white shadow-float
                    ${shouldFullFocus
                        ? "left-1/2 top-1/2 max-w-[calc(100vw-2rem)]"
                        : "right-3 top-[6.5rem] max-w-1/2 sm:right-5 sm:top-20"}
                `}
            >
                <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                >
                    <HiOutlineDotsHorizontal />
                </div>
                {renderModal(modal.view, modal.props)}
            </section>
        </>,
        document.body,
    );
}
