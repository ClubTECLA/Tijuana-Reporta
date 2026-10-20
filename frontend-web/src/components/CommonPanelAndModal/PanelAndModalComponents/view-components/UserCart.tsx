import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

const bgColor = {
    "transparent": "",
    "blue": "bg-brand-subtle",
    "red" : "bg-danger-subtle"
} as const satisfies Record<string, string>

interface userCartProps extends subsectionProps {
    username: string,
    email?: string | null,
    rolName?: string | null | number
    bg_color?: keyof typeof bgColor;
}

export default function UserCart({username, email, rolName, debug, format, bg_color = 'transparent'}: userCartProps) {
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

    return(
        <SubSection format={format} className={`flex-row w-full rounded-2xl items-center p-2 ${bgColor[bg_color]}`} debug={debug}>
            <div className="rounded-full flex items-center justify-center bg-brand text-white w-10 h-10 font-bold">
                {iconName}
            </div>
            <div className="ml-4 flex flex-col justify-center">
                <span className="font-bold text-md text-ink">{username || 'Usuario'}</span>
                <span className="text-xs text-ink-secondary">{email}</span>
                <span className="text-xs text-brand-text font-semibold">{rolName}</span>
            </div>
        </SubSection>    
    )
}