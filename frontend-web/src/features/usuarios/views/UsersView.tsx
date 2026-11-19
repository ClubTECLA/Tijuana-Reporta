import SearchBar from "@/app/SearchBar";
import ColSection from "@/components/layout/ColSection";
import RowSection from "@/components/layout/RowSection";
import FilterSelected from "@/components/ui/FilterSelected";
import type { OptionTileProps } from "@/components/ui/OptionsMenu";
import { useEffect, useRef, useState, useMemo } from "react";
import { listarRoles, listarUsuarios } from "../usuarios.services";
import type { ApiListarRolesResponse, ApiListarUsuariosResponse } from "@/types/api-types";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import { Table, TRow, TdButton, TCell, SimpleStatistics } from "@/components/ui/Tables"; 
import UserCard from "@/features/perfil/components/UserCard";
import ColorBadge, {type ColorBadgeColor} from "@/components/ui/ColorBadge";
import { IoIosMore } from "react-icons/io";
import Button from "@/components/ui/Button";
import { BiPlus } from "react-icons/bi";
import FooterUsersView from "../components/FooterUsersView";
import { roleLabel } from '@/lib/roles';
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import SubSection from "@/components/layout/SubSection";
import { FaUserEdit, FaUserMinus } from "react-icons/fa";

const roleColors: Record<string, ColorBadgeColor> = {
    admin: "blue",
    moderador: "amber",
    proteccion_civil: "green",
    rescatista: "red",
    analista: "gray",
    ciudadano: "gray",
};

const statusColors: Record<string, ColorBadgeColor> = {
    "Verificado": "green",
    "En revisión": "amber",
    "Pendiente": "gray",
    "Suspendido": "red",
    "no disponible": "gray",
};

type UserState = "Pendiente" | "En revisión" | "Verificado" | "Suspendido";
type UserWithState = ApiListarUsuariosResponse[number] & { state?: UserState | null };

const userStateOptions: OptionTileProps[] = [
    { id: "all", title: "Todos", isSelected: true },
    { id: "Pendiente", title: "Pendiente" },
    { id: "En revisión", title: "En revisión" },
    { id: "Verificado", title: "Verificado" },
    { id: "Suspendido", title: "Suspendido" },
    { id: "none", title: "sin estado" },
];

function getRoleOptions(roleNames: string[]): OptionTileProps[] {
    return [
        { id: "all", title: "Todos" },
        ...Array.from(new Set(roleNames), (role) => ({
            id: role,
            title: roleLabel(role),
        })),
    ];
}

function getUserKey(username: string, email?: string | null){
    return `${username}-${email ?? ""}`;
}

export default function UserView() {
    const [ users, setUsers ] = useState<UserWithState[]>([]);
    const [ userOptionsOpen, setUserOptionsOpen ] = useState(""); 
    const [ searchQuery, setSearchQuery ] = useState("");
    const [ roleFilter, setRoleFilter ] = useState("all");
    const [ statusFilter, setStatusFilter ] = useState("all");
    const usersFilter = users.filter(user =>
        (roleFilter === "all" || user.rol_name === roleFilter) &&
        (statusFilter === "all" ||
            (statusFilter === "none" ? user.state == null : user.state === statusFilter)) &&
        (searchQuery === "" ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const [roles, setRoles] = useState<ApiListarRolesResponse | null>(null);
    const rolesOptions = useMemo<OptionTileProps[]>(
        () =>
            roles
                ? getRoleOptions(roles.map((role) => role.nombre)) // catálogo completo
                : getRoleOptions(users.map((user) => user.rol_name)), // respaldo si /roles falla o aún no llega
        [roles, users],
    );

    const roleColor = (role: string): ColorBadgeColor =>
        Object.hasOwn(roleColors, role) ? roleColors[role] : "gray";
    const { showMessage } = useSysMessage();
    const [ currentPage, setCurrentPage ] = useState(1);
    const pageSize = 8;

    const tableBoxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        

        const closeUserOptions = (event: PointerEvent) => {
            
            if(!tableBoxRef) return;
            
            const target = event.target as Node;

            if(
                !tableBoxRef.current?.contains(target)
            ){
                setUserOptionsOpen("");
            }

        }

        document.addEventListener('pointerdown', closeUserOptions);

        return () => document.removeEventListener("pointerdown", closeUserOptions);
    }, []);

    useEffect(() => {
        listarUsuarios()
        .then(res => {
            setUsers(res.filter((u) => u.rol_name !== 'ciudadano'));
        })
        .catch(err => {
            console.error("Error al listar usuarios: ", err);
            showMessage("Error al obtener la lista de usuarios", {'color': 'red', 'showTime': 3000, 'title': 'Error', 'type': 'float'});
        })
    }, [showMessage]);

    const handleChangeSearch = (query: string) => {
        setCurrentPage(1);
        setSearchQuery(query);
    }

    const handleChangePage = (page: number ) => {
        setCurrentPage(page);
    }

    useEffect(() => {
        listarRoles()
            .then(setRoles)
            .catch(err => {
                console.error("Error al listar roles: ", err);
                showMessage("Error al obtener la lista de roles", {'color': 'red', 'showTime': 3000, 'title': 'Error', 'type': 'float'});
            });
    }, [showMessage]);

    const handleRoleChange = (roleId: string) => {
        setCurrentPage(1);
        setRoleFilter(roleId);
    }

    const handleStatusChange = (status: string) => {
        setCurrentPage(1);
        setStatusFilter(status);
    };

    return(
        <ColSection
            title="Usuarios"
            subtitle={`${usersFilter.length} cuentas de personal`}
            className="gap-4 flex-1 min-h-0"
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
                <SegmentedTabs>
                    <TabItem
                        tabTitle="Personal Autorizado"
                    />
                </SegmentedTabs>
                <SearchBar
                    onChangeQuery={handleChangeSearch}
                    placeholder="Buscar por nombre o correo electrónico"
                />
                <FilterSelected
                    label="Rol"
                    options={rolesOptions}
                    value={roleFilter}
                    onChangeOption={handleRoleChange}
                />
                <FilterSelected
                    label="Estado"
                    options={userStateOptions}
                    onChangeOption={handleStatusChange}
                />
            </RowSection>
            <SubSection
                ref={tableBoxRef}
                className="flex-col flex-1 min-h-0 justify-between h-fit"
            >
                {usersFilter.length !== 0 ? 
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
                            'title': "Estado"
                        },
                        {
                            'title': "Reportes"
                        },
                        {
                            'title': ""
                        }
                        ]}
                        format='col'
                    >
                        {usersFilter.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => 
                            <TRow key={getUserKey(user.username, user.email)}>
                                <TCell>
                                    <UserCard
                                        username={user.username}
                                        email={user.email}
                                    />
                                </TCell>
                                <TCell>
                                    <ColorBadge
                                        color={roleColor(user.rol_name)}
                                        text={roleLabel(user.rol_name)}
                                    />
                                </TCell>
                                <TCell>
                                    {(() => {
                                        const status = user.state ?? "no disponible";
                                        return (
                                            <ColorBadge
                                                color={statusColors[status] ?? "gray"}
                                                text={status}
                                            />
                                        );
                                    })()}
                                </TCell>
                                <TCell>
                                    <SimpleStatistics
                                        statistics={String(user.reportes_count)}
                                    />
                                </TCell>
                                {getUserKey(user.username, user.email) !== userOptionsOpen ?
                                    <TCell className="flex items-center justify-center w-full">
                                        <TdButton
                                            ariaLabel={`Más opciones para ${user.username}`}
                                            content={{
                                                icon: <IoIosMore/>
                                            }}
                                            onClick={() => setUserOptionsOpen(getUserKey(user.username, user.email))}
                                        />
                                    </TCell>
                                :
                                    <TCell className="flex flex-row items-center justify-center w-full">
                                        <TdButton
                                            ariaLabel={`Editar ${user.username}`}
                                            content={{
                                                icon: <FaUserEdit className="text-brand"/>
                                            }}
                                        />
                                        <TdButton
                                            ariaLabel={`Eliminar ${user.username}`}
                                            content={{
                                                icon: <FaUserMinus className="text-danger"/>
                                            }}
                                        />
                                    </TCell>
                                }
                            </TRow>
                        )}   
                    </Table>
                :
                    <span className="text-body font-normal text-ink-muted">Sin resultados</span>
                }
            </SubSection>
        </ColSection>
    );
}