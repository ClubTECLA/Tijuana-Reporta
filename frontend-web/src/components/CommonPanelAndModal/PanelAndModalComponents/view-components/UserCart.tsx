import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";

interface userCartProps extends subsectionProps {
    username: string,
    email?: string | null,
    rolName?: string | null | number
}

export default function UserCart({username, email, rolName, debug, format}: userCartProps) {
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
        <SubSection format={format} className="flex-row w-full rounded-2xl bg-blue-50 items-center p-2" debug={debug}>
            <div className="rounded-full flex items-center justify-center bg-blue-700 text-white w-10 h-10 font-bold">
                {iconName}
            </div>
            <div className="ml-4 flex flex-col justify-center">
                <span className="font-bold text-md text-gray-700">{username || 'Usuario'}</span>
                <span className="text-xs text-gray-600">{email}</span>
                <span className="text-xs text-blue-700 font-semibold">{rolName}</span>
            </div>
        </SubSection>    
    )
}