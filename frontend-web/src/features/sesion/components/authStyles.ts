// Estilos compartidos por los formularios de /auth.

export const formsInputsDivsStyle = `
    flex flex-col gap-1.5 w-full
`

export const inputsLabelsStyle = `
    text-sm font-semibold text-ink
`

export const inputsStyle = `
    h-11 w-full rounded-[31px] border border-line bg-white px-4
    text-sm text-ink outline-none transition-colors duration-200
    focus:border-brand
`

export const submitButtonStyle = `
    h-15 w-full rounded-full bg-brand px-7 text-lg font-bold text-white
    drop-shadow-button-brand transition duration-200
    hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-muted disabled:drop-shadow-none disabled:hover:brightness-100
`

export const formsStyle = `
    flex w-full max-w-130 flex-col items-start gap-4.5
    rounded-[28px] bg-white px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-9
    shadow-float
`

export const titleStyle = `text-2xl font-bold text-ink sm:text-[28px]`

export const subtitleStyle = `text-body leading-5.5 text-ink-secondary`
