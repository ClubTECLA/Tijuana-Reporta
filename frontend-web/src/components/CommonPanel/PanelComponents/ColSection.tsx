import type { ReactNode } from "react";

export default function ColSection({children}: {children: ReactNode}) {
    return(
        <section className="w-fit h-fit flex flex-col">
            {children}
        </section>
    )
}