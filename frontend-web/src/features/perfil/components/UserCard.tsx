import type { subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";
import { rolLabel } from "@/features/sesion/users";

const bgColor = {
    "transparent": "",
    "blue": "bg-brand-subtle",
    "red" : "bg-danger-subtle"
} as const satisfies Record<string, string>

interface UserCardProps extends subsectionProps {
    username: string,
    email?: string | null,
    rolName?: string | null | number
    bg_color?: keyof typeof bgColor;
}

export default function UserCard({username, email, rolName, debug, format, bg_color = 'transparent'}: UserCardProps) {
    const usernameArray = username.split(' ');
    let iconName:string;
    if(username.length === 0){
        iconName = `ME`
    }
    else if(usernameArray.length === 1){
        iconName = username.slice(0,2).toUpperCase();
    }else{
        iconName = `${usernameArray[0].slice(0,1)}${usernameArray[1].slice(0,1)}`.toUpperCase();
    }
    const role = rolName == null ? "" : String(rolName);

    return(
        <SubSection format={format} className={`flex-row w-full rounded-2xl items-center p-2 ${bgColor[bg_color]}`} debug={debug}>
            <div className="rounded-full flex items-center justify-center bg-brand text-surface w-10 h-10 font-bold">
                {iconName}
            </div>
            <div className="ml-4 flex flex-col justify-center">
                <span className="font-bold text-body text-ink">{username || 'Usuario'}</span>
                <span className="text-caption text-ink-secondary">{email}</span>
                {role && (
                    <span className="text-caption text-brand-text font-semibold">{rolLabel(role)}</span>
                )}
            </div>
        </SubSection>    
    )
}