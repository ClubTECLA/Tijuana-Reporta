import SearchBar from "@/app/SearchBar";
import ColSection from "@/components/layout/ColSection";
import RowSection from "@/components/layout/RowSection";
import FilterSelected from "@/components/ui/FilterSelected";
import type { OptionTileProps } from "@/components/ui/OptionsMenu";
import { useEffect, useState } from "react";
import { listarUsuarios } from "../usuarios.services";
import type { ApiListarUsuariosResponse } from "@/types/api-types";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import { Table, TRow, TdButton, TCell, SimpleStatistics } from "@/components/ui/Tables"; 
import UserCard from "@/features/perfil/components/UserCard";
import ColorBadge, {type ColorBadgeColor} from "@/components/ui/ColorBadge";
import { IoIosMore } from "react-icons/io";
import Button from "@/components/ui/Button";
import { BiPlus } from "react-icons/bi";
import FooterUsersView from "../components/FooterUsersView";

const roleColors: Record<string, ColorBadgeColor> = {
    admin: "blue",
    moderador: "amber",
    proteccion_civil: "green",
    rescatista: "red",
    analista: "gray",
    ciudadano: "gray",
};



export default function UserView() {
    const [ users, setUsers ] = useState<ApiListarUsuariosResponse>([]);
    const [ usersFilter, setUsersFilter ] = useState<ApiListarUsuariosResponse>([]);
    const [ rolesOptions, setRolesOptions ] = useState<OptionTileProps[]>([{'id': 'all', 'title': 'todos', 'isSelected': true}]);
    const { showMessage } = useSysMessage();
    const [ currentPage, setCurrentPage ] = useState(1);
    const pageSize = 8;

    useEffect(() => {
        listarUsuarios()
        .then(res => {
            setUsers(res);
            setUsersFilter(res);
        })
        .catch(err => {
            console.error("Error al listar usuarios: ", err);
            showMessage("Error al obtener la lista de usuarios", {'color': 'red', 'showTime': 3000, 'title': 'Error', 'type': 'float'});
        })
    }, []);

    const handleChangeSearch = (query: string) => {
        setCurrentPage(1);
        if(query === "") return setUsersFilter(users);
        setUsersFilter(users.filter(user => user.username.toLowerCase().includes(query.toLowerCase()) || user.email?.toLowerCase().includes(query.toLowerCase())));
    }

    const handleChangePage = (page: number ) => {
        setCurrentPage(page);
    }

    //this is temporary, when the getRoles endpoint is ready this will be replaced with a call to that endpoint, 
    // and the rolesOptions will be set with the response.
    useEffect(() => {
        if(users.length === 0) return;

        setRolesOptions([...users.map(user => ({
                id: user.rol_name,
                title: user.rol_name,
                isSelected: false
            })).filter((u, idx, arr) => arr.findIndex(v => v.id === u.id) === idx) //remove duplicates
        , {'id': 'all', 'title': 'todos', 'isSelected': true}]);
    }, [users]);

    const handleRoleChange = (roleId: string) => {
        setCurrentPage(1);
        if(roleId === 'all') return setUsersFilter(users);
        setUsersFilter(users.filter(user => user.rol_name === roleId)); 
    }  

    return(
        <ColSection
            title="Usuarios"
            subtitle={`${usersFilter.length} cuentas de personal`}
            className="gap-4"
            headerActions={
                <Button
                    icon={<BiPlus/>}
                    title="Invitar personal"
                    variant="primary"
                />
            }
            footerElement={
                <FooterUsersView
                    userLenght={usersFilter.length}
                    onChangePage={handleChangePage}
                    currentPage={currentPage}
                    pageSize={pageSize}
                />
            }
        >
            <RowSection
                className="gap-4"
            >
                <SearchBar
                    onChangeQuery={handleChangeSearch}
                />
                <FilterSelected
                    label="Rol"
                    options={rolesOptions}
                    onChangeOption={handleRoleChange}
                />
            </RowSection>
            <ColSection
                arrangementSubsections='between'
            >
                <Table
                    maxh="35rem"
                    headers={[
                    {
                        'title': "Usuario"
                    },
                    {
                        'title': "Rol"
                    },
                    {
                        'title': "Reportes"
                    },
                    {
                        'title': ""
                    }
                    ]}
                >
                    {usersFilter.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => 
                        <TRow key={user.email}>
                            <TCell>
                                <UserCard
                                    username={user.username}
                                    email={user.email}
                                />
                            </TCell>
                            <TCell>
                                <ColorBadge
                                    color={roleColors[user.rol_name] || "gray"}
                                    text={user.rol_name}
                                />
                            </TCell>
                            <TCell>
                                <SimpleStatistics
                                    statistics={String(user.reportes_count)}
                                />
                            </TCell>
                            <TdButton
                                content={{
                                    icon: <IoIosMore/>
                                }}
                            />
                        </TRow>
                    )}   
                </Table>
            </ColSection>
        </ColSection>
    );
}