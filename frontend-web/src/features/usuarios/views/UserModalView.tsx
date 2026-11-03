import ColSection from "@/components/layout/ColSection";
import UserCard from "@/features/perfil/components/UserCard";
import type { ApiUsuario } from "@/types/api-types";
import { useEffect, useState } from "react";

interface UserModalViewProps {
    userId: string;
    user?: ApiUsuario | null;
}

export default function UserModalView({ userId, user = null }: UserModalViewProps) {
    const [ userData, setUserData ] = useState<ApiUsuario | null>(user);

    useEffect(() => {
        if(!!userData) {
            setUserData(user);
            return;
        };
        //fetch user data from API using userId
    },[])
 

    return(
        <ColSection
            
        >
            <UserCar

            />
        </ColSection>
    )
};