import {
  createElement,
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { modalRegistry } from "./modalRegistry";
import type { ModalViewKey, ModalViewProps } from "./modalTypes";
import useModals from "./useModals";

interface ModalChromeProps {
  fullFocus?: boolean;
}

function renderModal<K extends ModalViewKey>(
  view: K,
  props: ModalViewProps<K>,
) {
  const ModalView = modalRegistry[view] as ComponentType<object>;
  return createElement(ModalView, props);
}

export default function ModalChrome({ fullFocus }: ModalChromeProps) {
  const { modal, position, setPosition } = useModals();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const modalPosAtStart = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const previousFocusContextRef = useRef<HTMLElement[]>([]);
  const wasFullFocusRef = useRef(false);
  const shouldFullFocus = fullFocus ?? modal?.fullFocus ?? false;
  const draggable = !shouldFullFocus;
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getFocusableElements = (container: ParentNode) =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable="true"]',
        ),
      ).filter((element) => {
        const style = window.getComputedStyle(element);
        return (
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getClientRects().length > 0
        );
      });

    if (!shouldFullFocus || !modal) {
      if (wasFullFocusRef.current) {
        wasFullFocusRef.current = false;
        const previouslyFocused = previouslyFocusedRef.current;
        previouslyFocusedRef.current = null;
        const previousFocusContext = previousFocusContextRef.current;
        previousFocusContextRef.current = [];
        const focusTarget =
          previouslyFocused?.isConnected &&
          getFocusableElements(document).includes(previouslyFocused)
            ? previouslyFocused
            : (previousFocusContext
                .filter((container) => container.isConnected)
                .flatMap(getFocusableElements)
                .find((element) => !modalRef.current?.contains(element)) ??
              getFocusableElements(document).find(
                (element) => !modalRef.current?.contains(element),
              ));
        focusTarget?.focus();
      }
      return;
    }

    if (!wasFullFocusRef.current) {
      const activeElement = document.activeElement;
      previouslyFocusedRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
      previousFocusContextRef.current = [];
      for (
        let parent =
          activeElement instanceof HTMLElement
            ? activeElement.parentElement
            : null;
        parent;
        parent = parent.parentElement
      ) {
        previousFocusContextRef.current.push(parent);
      }
      wasFullFocusRef.current = true;
    }

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusableElements = getFocusableElements(modalElement);
    (focusableElements[0] ?? modalElement).focus();

    const containTabFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const currentModal = modalRef.current;
      if (!currentModal) return;

      const currentFocusableElements = getFocusableElements(currentModal);
      const first = currentFocusableElements[0];
      const last =
        currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement;
      const isWithinModal = currentModal.contains(activeElement);
      const isFocusable =
        activeElement instanceof HTMLElement &&
        currentFocusableElements.includes(activeElement);

      if (!first || !last) {
        event.preventDefault();
        currentModal.focus();
      } else if (!isWithinModal || !isFocusable) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (
        event.shiftKey &&
        (activeElement === first || activeElement === currentModal)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", containTabFocus, true);
    return () => document.removeEventListener("keydown", containTabFocus, true);
  }, [modal, shouldFullFocus]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    // Capturar el puntero permite continuar el arrastre aunque el cursor salga del control.
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    modalPosAtStart.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const VISIBLE_MARGIN = 8;

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

  const clampToViewport = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const rect = handle.getBoundingClientRect();
    let dx = 0;
    let dy = 0;

    if (rect.left < VISIBLE_MARGIN) dx = VISIBLE_MARGIN - rect.left;
    else if (rect.right > window.innerWidth - VISIBLE_MARGIN)
      dx = window.innerWidth - VISIBLE_MARGIN - rect.right;

    if (rect.top < VISIBLE_MARGIN) dy = VISIBLE_MARGIN - rect.top;
    else if (rect.bottom > window.innerHeight - VISIBLE_MARGIN)
      dy = window.innerHeight - VISIBLE_MARGIN - rect.bottom;

    if (dx !== 0 || dy !== 0) {
      setPosition({ x: position.x + dx, y: position.y + dy });
    }
  }, [position, setPosition]);

  // Tras cada cambio de posición, antes de pintar: evita un parpadeo fuera de pantalla.
  useLayoutEffect(() => {
    if (!modal || shouldFullFocus) return;
    clampToViewport();
  }, [modal, shouldFullFocus, clampToViewport]);

  useEffect(() => {
    if (!modal || shouldFullFocus) return;
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [modal, shouldFullFocus, clampToViewport]);

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
        ref={modalRef}
        tabIndex={shouldFullFocus ? -1 : undefined}
        style={
          shouldFullFocus
            ? undefined // centrada por CSS: no usa `position`
            : { transform: `translate3d(${position.x}px, ${position.y}px, 0)` }
        }
        className={`
    fixed z-[60] w-fit pointer-events-auto
    flex flex-col items-center
    rounded-xl bg-white shadow-float
    ${
      shouldFullFocus
        ? "inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)]"
        : "right-3 top-34 max-w-[calc(100vw-1.5rem)] sm:right-5 sm:max-w-[calc(100vw-2.5rem)] lg:top-20"
    }
  `}
      >
        {draggable && (
          <div
            ref={handleRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`touch-none select-none p-2 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <HiOutlineDotsHorizontal aria-hidden="true" />
          </div>
        )}
        <div className="min-h-0 w-full overflow-y-auto overscroll-contain">
          {renderModal(modal.view, modal.props)}
        </div>
      </section>
    </>,
    document.body,
  );
}
