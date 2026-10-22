import { 
    createContext, 
    useContext,
    useState, 
    type ReactNode, 
    type Dispatch, 
    type SetStateAction,
    useRef
} from "react";
import { createPortal } from "react-dom";
import { modals, type modalsKey } from "../../types/global-modals";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

type Position = { x: number; y: number };

type ModalsContextType = {
    setModalView: (key: modalsKey | null) => void;
    closeModal: () => void;
    currentModal: modalsKey | null;
    position: Position;
    setPosition: Dispatch<SetStateAction<Position>>;
    resetPosition: () => void;
};

export const ModalsContext = createContext<ModalsContextType | undefined>(undefined);

export function ModalsProvider({ children }: { children: ReactNode }) {
    const [ currentModal, setCurrentModal ] = useState<modalsKey | null>(null);
    const [ position, setPosition ] = useState<Position>({ x: 0, y: 0 });

    const resetPosition = () => setPosition({ x: 0, y: 0 });

    const handleSetModalView = (key: modalsKey | null) => {
        resetPosition();
        setCurrentModal(key);
    };

    const handleCloseModal = () => {
        resetPosition();
        setCurrentModal(null);
    };

    return (
        <ModalsContext.Provider
            value={{
                setModalView: handleSetModalView,
                closeModal: handleCloseModal,
                currentModal,
                position,
                setPosition,
                resetPosition,
            }}
        >
            {children}
        </ModalsContext.Provider>
    );
}

export function ModalOverlay() {
    const context = useContext(ModalsContext);

    if (!context) {
        throw new Error("ModalOverlay must be used within a ModalsProvider");
    }

    const { currentModal, position, setPosition } = context;
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const modalPosAtStart = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

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

    if (!currentModal) return null;

    return createPortal(
        <section
            style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            }}
            className="
                fixed right-3 top-[6.5rem] z-[60]
                sm:right-5 sm:top-20
                w-fit max-w-1/2
                pointer-events-auto
                flex flex-col items-center justify-center
                rounded-xl bg-white shadow-float
            "
        >
            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`
                    touch-none select-none
                    ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                `}
            >
                <HiOutlineDotsHorizontal/>
            </div>
            {modals[currentModal]}
        </section>,
        document.body,
    );
}