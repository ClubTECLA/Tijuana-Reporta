import { Children, isValidElement, type ElementType, type ReactNode } from "react";

export function validateChildren(
    children: ReactNode,
    componentName: string,
    allowedChildType?: ElementType[],
    allowedChildName?: string,
) {
    const childArray = Children.toArray(children).filter((c) => c !== null && c !== undefined);
    const expectedChild = allowedChildName ?? "React element";

    if (childArray.length === 0) {
        throw new Error(`${componentName} requires at least one ${expectedChild}.`);
    }

    childArray.forEach((child, index) => {
        if (
            !isValidElement(child)
            || (allowedChildType !== undefined && !allowedChildType.includes(child.type as ElementType))
        ) {
            throw new Error(
                `${componentName} only accepts direct ${allowedChildName} children. `
                + `Invalid child at position ${index + 1}.`,
            );
        }
    });
}
