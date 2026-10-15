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
  'both-full': 'h-full w-full',
  'nothing': ''
} as const satisfies Record<string, string>

export interface subsectionProps {
    debug?: boolean
    format?: keyof typeof subsectionFormats
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

export type HexColor = `#${string}`;


export const headerButtonColors = {
    green: 'bg-green-500 hover:bg-green-300',
    red: 'bg-red-500 hover:bg-red-300',
    blue: 'bg-blue-500 hover:bg-blue-300'
} as const satisfies Record<string, string>;

export const borders = {
    right: 'border-r-2',
    left: 'border-l-2',
    top: 'border-t-2',
    bottom: 'border-b-2',
    all: 'border-2'
} as const satisfies Record<string, string>

type borderType = keyof typeof borders;

export type headerBtnsType = {
    title: string
    icon?: ReactNode
    onClick?: () => void
    color: keyof typeof headerButtonColors
}[]

export interface SectionProps {
    children: ReactNode,
    debug?: boolean
    title?: string
    subtitle?: string
    extraHeaderBtns?: headerBtnsType 
    className?: string
    footerText?: string
    border?: borderType[]
}