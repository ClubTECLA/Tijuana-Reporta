import type { ReactNode } from "react"
import { IoDocumentTextOutline } from "react-icons/io5"
import { LuMessageCircle } from "react-icons/lu"
import { MdOutlineReportProblem } from "react-icons/md"

//extra types

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

export const NotiIcons = {
  'report': <IoDocumentTextOutline />,
  'moderation': <MdOutlineReportProblem/>,
  'system': <LuMessageCircle/>
} as const satisfies Record<string, ReactNode>

export type NotiType = keyof typeof NotiIcons;