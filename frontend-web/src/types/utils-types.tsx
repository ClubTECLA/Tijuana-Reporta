import type { ReactNode } from "react"
import { IoDocumentTextOutline } from "react-icons/io5"
import { LuMessageCircle } from "react-icons/lu"
import { MdOutlineReportProblem } from "react-icons/md"

//extra types

export type componentProps = {
  className?: string
  onClick?: () => void
}

export type NavItem = {
  icon: ReactNode
  title: string
  destinationPath: string
  cantNoti?: number
}

export const subsectionFormats = {
  'row': 'h-full w-fit',
  'col': 'h-fit w-full',
  'both-fit': 'h-fit w-fit',
  'both-full': 'h-full w-full'
} as const satisfies Record<string, string>

export interface subsectionProps {
    debug?: boolean
    format: keyof typeof subsectionFormats
    subKey?: string | number;
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