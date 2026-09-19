'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type SysMessageContextType = {
    showMessage: (message: string, color?: 'red' | 'green' | 'yellow', time?: number | null, title?:string) => void;
    setMessage: (message: string) => void;
    setMessageColor: (color: 'red' | 'green') => void;
    setShowTime: (ms: number) => void;
    setTypeMessage: (type: "float" | "inline") => void;
    MessageInline: () => ReactNode;
    cleanMessage: () => void;
}

const SysMessageContext = createContext<SysMessageContextType | null>(null);


export function SysMessageProvider({ children }: { children: React.ReactNode }) {
    const [message, setMessage] = useState('');
    const [ title, setTitle ] = useState('');
    const [messageColor, setMessageColor] = useState<'red' | 'green' | 'yellow'>('green');
    const [showTime, setShowTime] = useState<number | null>(null);
    const [animate, setAnimate] = useState(false);
    const [ typeMessage, setTypeMessage ] = useState<"float" | "inline">("float");

    const showMessage = useCallback((msg: string, color: 'red' | 'green' | 'yellow' = 'green', time: number | null = null, title?: string ) => {
        setMessage(msg);
        setMessageColor(color);
        setShowTime(time);
        if (title) {
            setTitle(title);
        }else{
            setTitle('');
        }
    }, []);

    const cleanMessage = () => {
        setMessage('');
        setTitle('');
        setAnimate(false);
    }

    useEffect(() => {
        if (!message) return;

        const entryTimeout = setTimeout(() => setAnimate(true), 50);

        let exitTimeout = null;
        if(showTime !== null){ 
            exitTimeout = setTimeout(() => {
                setAnimate(false);
                setTimeout(() => setMessage(""), 300);
            }, showTime);
        }

        return () => {
            clearTimeout(entryTimeout);
            if(exitTimeout){
                clearTimeout(exitTimeout);
            }
        };
    }, [message, showTime]);

    const config = {
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
        yellow:{
            wrapper: "bg-yellow-50 border-yellow-200 text-yellow-800",
            icon: (
                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        }
    };

    const currentStyle = config[messageColor];

    return (
        <SysMessageContext.Provider 
            value={{ 
                showMessage, 
                setMessage, 
                setMessageColor: setMessageColor as any, 
                setShowTime, 
                setTypeMessage,
                cleanMessage,
                MessageInline: () => {
                    return (
                        <>
                            {message && typeMessage === "inline" && (
                                <div className={`
                                    flex flex-row items-center gap-3 px-5 py-3.5
                                    border rounded-2xl 
                                    ${currentStyle.wrapper}
                                `}>
                                    {currentStyle.icon}
                                    <div className="flex flex-col">
                                        <span className="text-md font-bold">{title}</span>
                                        <span className="text-xs font-medium leading-snug">{message}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                }
            }}>
            {children}

            {message && typeMessage === "float" && (
                <div className={`
                    fixed left-1/2 -translate-x-1/2 z-[100]
                    flex items-center gap-3 px-5 py-3.5
                    border rounded-2xl shadow-xl shadow-zinc-200/50
                    w-max max-w-[90vw]
                    transition-all duration-300 ease-out font-sn-pro
                    ${currentStyle.wrapper}
                    ${animate? "top-25 opacity-100 scale-100" : "-top-10 opacity-0 scale-95"}
                `}>
                    {currentStyle.icon}
                    <div className="flex flex-col">
                        <span className="text-md font-bold">{title}</span>
                        <span className="text-xs font-medium leading-snug">{message}</span>
                    </div>
                </div>
            )}
        </SysMessageContext.Provider>
    );
}

export function useSysMessage(typeMessage: "float" | "inline"= "float") {
    const ctx = useContext(SysMessageContext);
    if (!ctx) throw new Error("useSysMessage debe usarse dentro de <SysMessageProvider>");
    ctx.setTypeMessage(typeMessage);
    return ctx;
}