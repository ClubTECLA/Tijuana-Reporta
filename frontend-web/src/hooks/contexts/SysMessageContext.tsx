'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";

/** Supported visual states for system messages. */
type MessageColor = 'red' | 'green' | 'yellow';

/** Controls whether a message is rendered in the document flow or over the page. */
type MessageType = "float" | "inline";

/**
 * Optional configuration for showMessage.
 *
 * Use type "inline" for validation feedback inside a form or section:
 * showMessage("The email is required", {
 *     type: "inline",
 *     color: "red",
 *     title: "Validation error",
 * });
 *
 * Use type "float" for notifications that should appear above the page content:
 * showMessage("The report was saved", {
 *     type: "float",
 *     color: "green",
 *     showTime: 4000,
 * });
 */
type ShowMessageOptions = {
    color?: MessageColor;
    title?: string;
    showTime?: number | null;
    type?: MessageType;
};

/** Internal state and actions exposed to consumers of the message context. */
type SysMessageContextType = {
    showMessage: (msg: string, options?: ShowMessageOptions | MessageColor, title?: string) => void;
    cleanMessage: () => void;
    messageState: MessageBoxProps;
};

const SysMessageContext = createContext<SysMessageContextType | null>(null);

/** Maps each message color to its visual classes and icon. */
const config: Record<MessageColor, { wrapper: string; icon: React.ReactNode }> = {
    green: {
        wrapper: "bg-emerald-50 border-emerald-200 text-emerald-800",
        icon: (
            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        )
    },
    red: {
        wrapper: "bg-red-50 border-red-200 text-red-800",
        icon: (
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        )
    },
    yellow: {
        wrapper: "bg-yellow-50 border-yellow-200 text-yellow-800",
        icon: (
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        )
    }
};

type MessageBoxProps = {
    message: string;
    title: string;
    color: MessageColor;
    type: MessageType;
    isVisible: boolean;
    animate: boolean;
};

/**
 * Renders the current message using the selected display mode.
 *
 * Inline messages remain in the normal document flow. Float messages use fixed
 * positioning and are animated from the top of the viewport.
 */
function MessageBox({ message, title, color, type, isVisible, animate }: MessageBoxProps) {
    if (!isVisible || !message) return null;

    const currentStyle = config[color];

    if (type === "inline") {
        return (
            <div className={`
                flex flex-row items-center gap-3 px-5 py-3.5 w-full
                border rounded-2xl transition-all duration-300 ease-out
                ${currentStyle.wrapper}
                ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            `}>
                {currentStyle.icon}
                <div className="flex flex-col">
                    {title && <span className="text-md font-bold">{title}</span>}
                    <span className="text-xs font-medium leading-snug">{message}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`
            fixed left-1/2 -translate-x-1/2 z-[100]
            flex items-center gap-3 px-5 py-3.5
            border rounded-2xl shadow-xl shadow-zinc-200/50
            w-max max-w-[90vw]
            transition-all duration-300 ease-out font-sn-pro
            ${currentStyle.wrapper}
            ${animate ? "top-24 opacity-100 scale-100" : "top-0 opacity-0 scale-95 pointer-events-none"}
        `}>
            {currentStyle.icon}
            <div className="flex flex-col">
                {title && <span className="text-md font-bold">{title}</span>}
                <span className="text-xs font-medium leading-snug">{message}</span>
            </div>
        </div>
    );
}

/**
 * Provides message state and actions to the component tree.
 *
 * The provider must wrap every component that calls useSysMessage or renders
 * SysMessage. Render SysMessage once in the consumer where the message should
 * be mounted. It can be placed inside a form for inline feedback or near the
 * root of a page for floating notifications.
 *
 * Example:
 *
 * <SysMessageProvider>
 *     <App />
 * </SysMessageProvider>
 */
export function SysMessageProvider({ children }: { children: React.ReactNode }) {
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [messageColor, setMessageColor] = useState<MessageColor>('green');
    const [showTime, setShowTime] = useState<number | null>(4000);
    const [typeMessage, setTypeMessage] = useState<MessageType>("float");

    const [isVisible, setIsVisible] = useState(false);
    const [animate, setAnimate] = useState(false);

    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Hides the current message using the same duration as its entrance transition. */
    const cleanMessage = useCallback(() => {
        setAnimate(false);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setMessage('');
            setTitle('');
        }, 300);
    }, []);

    /**
     * Displays a message and starts its entrance animation.
     *
     * The preferred signature uses an options object:
     * showMessage("Please complete all fields", {
     *     type: "inline",
     *     color: "red",
     *     title: "Missing fields",
     *     showTime: 3000,
     * });
     *
     * The default type is "float". The color-string form is retained for
     * compatibility with existing callers:
     * showMessage("Request failed", "red", "Request error");
     */
    const showMessage = useCallback((
        msg: string,
        options?: ShowMessageOptions | MessageColor,
        legacyTitle?: string
    ) => {
        let color: MessageColor = 'green';
        let tTitle = '';
        let time: number | null = 4000;
        let type: MessageType = 'float';

        if (typeof options === 'string') {
            color = options;
            tTitle = legacyTitle || '';
        } else if (options) {
            color = options.color || 'green';
            tTitle = options.title || '';
            time = options.showTime !== undefined ? options.showTime : 4000;
            type = options.type || 'float';
        }

        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        setMessage(msg);
        setMessageColor(color);
        setTitle(tTitle);
        setShowTime(time);
        setTypeMessage(type);
        setAnimate(false);  
        setIsVisible(true);
    }, []);

    /*
     * The two animation frames ensure that the hidden styles are committed
     * before the visible styles are applied. This gives the browser two
     * distinct layout states to interpolate between.
     */
    useEffect(() => {
        if (!isVisible) return;

        let rafId2 = 0;
        const rafId1 = requestAnimationFrame(() => {
            rafId2 = requestAnimationFrame(() => setAnimate(true));
        });

        let exitTimeout: ReturnType<typeof setTimeout> | undefined;
        if (showTime) {
            exitTimeout = setTimeout(() => {
                cleanMessage();
            }, showTime);
        }

        return () => {
            cancelAnimationFrame(rafId1);
            if (rafId2) cancelAnimationFrame(rafId2);
            if (exitTimeout) clearTimeout(exitTimeout);
        };
    }, [isVisible, showTime, message, cleanMessage]);

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    const value = useMemo(
        () => ({
            showMessage,
            cleanMessage,
            messageState: {
                message,
                title,
                color: messageColor,
                type: typeMessage,
                isVisible,
                animate,
            },
        }),
        [showMessage, cleanMessage, message, title, messageColor, typeMessage, isVisible, animate]
    );

    return (
        <SysMessageContext.Provider value={value}>
            {children}
        </SysMessageContext.Provider>
    );
}

/**
 * Returns the message actions and current state for a child of the provider.
 *
 * Example:
 * const { showMessage, cleanMessage } = useSysMessage();
 *
 * showMessage("The report was saved", {
 *     type: "float",
 *     color: "green",
 * });
 */
export function useSysMessage() {
    const ctx = useContext(SysMessageContext);
    if (!ctx) throw new Error("useSysMessage debe usarse dentro de <SysMessageProvider>");
    return ctx;
}

/**
 * Renders the current system message.
 *
 * For an inline message, render this component at the desired location in the
 * document flow, such as directly below a form heading:
 *
 * <SysMessage />
 *
 * Then call showMessage with type "inline":
 * showMessage("The password is required", {
 *     type: "inline",
 *     color: "red",
 *     title: "Validation error",
 * });
 *
 * For a floating message, render the same component once in the page layout
 * and call showMessage with type "float". The component uses fixed positioning
 * and does not occupy layout space:
 *
 * <SysMessage />
 *
 * showMessage("The report was submitted", {
 *     type: "float",
 *     color: "green",
 *     showTime: 4000,
 * });
 */
export function SysMessage() {
    const { messageState } = useSysMessage();
    return <MessageBox {...messageState} />;
}