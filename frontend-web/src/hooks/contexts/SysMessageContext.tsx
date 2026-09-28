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
//react icons imports
import { FiAlertCircle, FiAlertTriangle } from "react-icons/fi";
import {IoMdCheckmarkCircleOutline} from "react-icons/io" 
import { IoCloseOutline } from "react-icons/io5";



/** Supported visual states for system messages. */
type MessageColor = 'red' | 'green' | 'yellow' | 'blue';

/** Controls whether a message is rendered in the document flow or over the page. */
type MessageType = "float" | "inline";

type JustifyFloatMessage = 'start' | 'center' | 'end';

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
    justify?: JustifyFloatMessage;
};

/** Internal state and actions exposed to consumers of the message context. */
type SysMessageContextType = {
    showMessage: (msg: string, options?: ShowMessageOptions | MessageColor, title?: string) => void;
    cleanMessage: () => void;
    messageState: MessageState;
};

const SysMessageContext = createContext<SysMessageContextType | null>(null);

/** Maps each message color to its visual classes and icon. */
const config: Record<MessageColor, { icon: React.ReactNode; barClass: string; wrapped: string }> = {
    green: {
        icon: <IoMdCheckmarkCircleOutline className="text-green-500 text-4xl"/>,
        barClass: "border-l-green-500",
        wrapped: "break-words whitespace-normal text-green-800 bg-green-100",
    },
    red: {
        icon: <FiAlertTriangle className="text-red-500 text-4xl"/>,
        barClass: "border-l-red-500",
        wrapped: "break-words whitespace-normal text-red-500 bg-red-100",
    },
    yellow: {
        icon: <FiAlertCircle className="text-yellow-500 text-4xl"/>,
        barClass: "border-l-yellow-500",
        wrapped: "break-words whitespace-normal text-yellow-700 bg-yellow-50",
    },
    blue: {
        icon: <IoMdCheckmarkCircleOutline className="text-blue-500 text-4xl"/>,
        barClass: "border-l-blue-500",
        wrapped: "break-words whitespace-normal text-blue-700 bg-blue-100",
    }
};

type MessageBoxProps = {
    message: string;
    title: string;
    color: MessageColor;
    type: MessageType;
    isVisible: boolean;
    animate: boolean;
    justify: JustifyFloatMessage;
    onClose: () => void;
};

type MessageState = Omit<MessageBoxProps, "onClose">;

/**
 * Renders the current message using the selected display mode.
 *
 * Inline messages remain in the normal document flow. Float messages use fixed
 * positioning and are animated from the top of the viewport.
 */
function MessageBox({ message, title, color,justify, type,isVisible, animate, onClose }: MessageBoxProps) {
    if (!isVisible || !message) return null;

    const currentStyle = config[color];

    const justifyM: Record<JustifyFloatMessage, string> = {
        'end': 'right-10',
        'center': 'left-1/2 -translate-x-1/2',
        'start': 'left-10'
    }

    if (type === "inline") {
        return (
            <div className={`
                flex flex-row items-center gap-3 px-5 py-1 w-full
                rounded-2xl transition-all duration-300 ease-out
                ${currentStyle.wrapped}
                ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            `}>
                {currentStyle.icon}
                <div className={`flex flex-col`}>
                    {title && <span className="text-md font-bold">{title}</span>}
                    <span className="text-xs font-medium leading-snug">{message}</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto rounded-md p-1"
                    aria-label="Cerrar mensaje"
                >
                    <IoCloseOutline className="text-3xl" />
                </button>
            </div>
        );
    }

    return (
        <div className={`
            fixed ${justifyM[justify]} z-[100]
            flex items-center gap-3 px-5 py-3.5
            border-l-4 ${currentStyle.barClass} rounded-2xl shadow-xl shadow-zinc-200/50
            w-max max-w-[90vw] bg-white
            transition-all duration-300 ease-out font-sn-pro
            ${animate ? "top-20 opacity-100 scale-100" : "top-0 opacity-0 scale-95 pointer-events-none"}
        `}>
            {currentStyle.icon}
            <div className={`flex flex-col break-words whitespace-normal`}>
                {title && <span className="text-md font-bold">{title}</span>}
                <span className="text-xs font-medium leading-snug">{message}</span>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-md p-1 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Cerrar mensaje"
            >
                <IoCloseOutline className="text-3xl" />
            </button>
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
    const [floatMessageJustify, setFloatMessageJustify] = useState<JustifyFloatMessage>('end');

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
        let justify: JustifyFloatMessage = 'end';

        if (typeof options === 'string') {
            color = options;
            tTitle = legacyTitle || '';
        } else if (options) {
            color = options.color || 'green';
            tTitle = options.title || '';
            time = options.showTime !== undefined ? options.showTime : 4000;
            type = options.type || 'float';
            justify = options.justify || 'end';
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
        setFloatMessageJustify(justify);
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
                justify: floatMessageJustify,
                isVisible,
                animate,
            },
        }),
        [showMessage, cleanMessage, message, title, messageColor, typeMessage, floatMessageJustify, isVisible, animate]
    );

    return (
        <SysMessageContext.Provider value={value}>
            {children}
            {typeMessage === "float" && (
                <MessageBox {...value.messageState} onClose={cleanMessage} />
            )}
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
    const { messageState, cleanMessage } = useSysMessage();
    if (messageState.type !== "inline") return null;
    return <MessageBox {...messageState} onClose={cleanMessage} />;
}