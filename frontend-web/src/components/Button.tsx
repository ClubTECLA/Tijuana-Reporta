import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export default function Button ({ children, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={className}>
      {children}
    </button>
  )
}
