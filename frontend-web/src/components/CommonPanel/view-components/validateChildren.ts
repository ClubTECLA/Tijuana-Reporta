import { Children, isValidElement, type ElementType, type ReactNode } from "react";

export function validateChildren(
    children: ReactNode,
    componentName: string,
    allowedChildType?: ElementType,
    allowedChildName?: string,
) {
    const childArray = Children.toArray(children);
    const expectedChild = allowedChildName ?? "React element";

    if (childArray.length === 0) {
        throw new Error(`${componentName} requires at least one ${expectedChild}.`);
    }

    childArray.forEach((child, index) => {
        if (
            !isValidElement(child)
            || (allowedChildType !== undefined && child.type !== allowedChildType)
        ) {
            throw new Error(
                `${componentName} only accepts direct ${expectedChild} children. `
                + `Invalid child at position ${index + 1}.`,
            );
        }
    });
}
