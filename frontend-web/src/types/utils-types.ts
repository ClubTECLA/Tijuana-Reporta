import type { ReactNode } from "react"

//extra types
export type componentProps = {
  className?: string,
  onClick?: () => void
}

export type NavItem = {
  icon: ReactNode
  title: string
  destinationPath: string
  cantNoti?: number
}

export interface subsectionProps {
    debug?: boolean
    format: "row" | "col"
}

export type NavItemsType = {
  icon: ReactNode,
  title: string,
  destinationPath?: string,
  onClick?: () => void,
  cantNoti?: number
}[]