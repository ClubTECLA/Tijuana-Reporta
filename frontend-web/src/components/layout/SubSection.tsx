import {
    Children,
    cloneElement,
    Fragment,
    isValidElement,
    type ComponentPropsWithoutRef,
    type ReactNode,
} from "react";
import { Link, type LinkProps } from "react-router-dom";
import { subsectionFormats, type subsectionProps } from "@/types/utils-types";

type ElementKind = "div" | "button" | "span" | "link";

interface SharedProps extends subsectionProps {
    children?: ReactNode;
    className?: string;
    as?: ElementKind;
    ariaLabel?: string;
}

type DivSubSectionProps = SharedProps
    & Omit<ComponentPropsWithoutRef<"div">, keyof SharedProps | "key">
    & { as?: "div" };

type ButtonSubSectionProps = SharedProps
    & Omit<ComponentPropsWithoutRef<"button">, keyof SharedProps | "key">
    & { as: "button" };

type SpanSubSectionProps = SharedProps
    & Omit<ComponentPropsWithoutRef<"span">, keyof SharedProps | "key">
    & { as: "span" };

type LinkSubSectionProps = SharedProps
    & Omit<LinkProps, keyof SharedProps | "key">
    & { as: "link"; to: LinkProps["to"] };

export type SubSectionProps =
    | DivSubSectionProps
    | ButtonSubSectionProps
    | SpanSubSectionProps
    | LinkSubSectionProps;

function cloneWithDebug(child: ReactNode, debug?: boolean): ReactNode {
    // Ni las etiquetas HTML ni los Fragment aceptan la prop `debug`.
    if (!isValidElement<subsectionProps>(child) || typeof child.type === "string" || child.type === Fragment) {
        return child;
    }

    return cloneElement(child, {
        debug: debug || child.props.debug,
    });
}

export default function SubSection(props: SubSectionProps) {
    const getClassName = (className?: string, format?: keyof typeof subsectionFormats, debug?: boolean) => `
        flex ${subsectionFormats[format ?? "nothing"]}
        ${className ?? ""}
        ${debug ? "border-2 border-blue-400" : ""}
    `;
    if (props.as === "link") {
        const {
            children,
            className,
            debug,
            format,
            subKey,
            ariaLabel,
            as: _as,
            to,
            "aria-label": nativeAriaLabel,
            ...linkProps
        } = props;
        void _as;
        const linkChildren = Children.map(children, (child) => cloneWithDebug(child, debug));

        return (
            <Link
                {...linkProps}
                className={getClassName(className, format, debug)}
                to={to}
                key={subKey}
                aria-label={ariaLabel ?? nativeAriaLabel}
            >
                {linkChildren}
            </Link>
        );
    }

    if (props.as === "button") {
        const {
            children,
            className,
            debug,
            format,
            subKey,
            ariaLabel,
            as: _as,
            "aria-label": nativeAriaLabel,
            ...buttonProps
        } = props;
        void _as;
        const buttonChildren = Children.map(children, (child) => cloneWithDebug(child, debug));

        return (
            <button
                {...buttonProps}
                className={getClassName(className, format, debug)}
                key={subKey}
                aria-label={ariaLabel ?? nativeAriaLabel}
            >
                {buttonChildren}
            </button>
        );
    }

    if (props.as === "span") {
        const {
            children,
            className,
            debug,
            format,
            subKey,
            ariaLabel,
            as: _as,
            "aria-label": nativeAriaLabel,
            ...spanProps
        } = props;
        void _as;
        const spanChildren = Children.map(children, (child) => cloneWithDebug(child, debug));

        return (
            <span
                {...spanProps}
                className={getClassName(className, format, debug)}
                key={subKey}
                aria-label={ariaLabel ?? nativeAriaLabel}
            >
                {spanChildren}
            </span>
        );
    }

    const {
        children,
        className,
        debug,
        format,
        subKey,
        ariaLabel,
        as: _as,
        "aria-label": nativeAriaLabel,
        ...divProps
    } = props;
    void _as;
    const divChildren = Children.map(children, (child) => cloneWithDebug(child, debug));

    return (
        <div
            {...divProps}
            className={getClassName(className, format, debug)}
            key={subKey}
            aria-label={ariaLabel ?? nativeAriaLabel}
        >
            {divChildren}
        </div>
    );
}
