import type { ReactNode } from "react";

export default function RowSection({children}: {children: ReactNode}) {
    return(
        <section className="w-fit h-fit flex flex-row">
            {children}
        </section>
    )
}