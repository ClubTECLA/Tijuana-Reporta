import { MdOutlineReportProblem } from "react-icons/md"
import ColSection from "../PanelAndModalComponents/primitive-components/ColSection"
import { ListTile, OptionList } from "../PanelAndModalComponents/view-components/OptionsList"
import type { ReactNode } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import Button from "../PanelAndModalComponents/view-components/Button";
import { LuSun } from "react-icons/lu";

const QueQuieresRecibirItems: {
    tileName: string;
    type?: 'checkbox' | 'button';
    onChange: () => void;
    icon: ReactNode;
}[] = [
    {
        tileName: "Reportes Nuevos",
        type: 'checkbox',
        onChange: () => {},
        icon: <MdOutlineReportProblem/>
    },

]

const PorDondeItems: {
    tileName: string;
    type?: 'checkbox' | 'button';
    onChange: () => void;
    icon: ReactNode;
}[] = [
    {
        tileName: "En la plataforma",
        type: 'checkbox',
        onChange: () => {},
        icon: <IoMdNotificationsOutline/>
    },
]

export default function NotificationsView() {
    return (
        <ColSection
            arrangementSubsections="toDown"
            title="Notificaciones"
            subtitle="Elige que te avisamos y por donde"
        >
            <OptionList
                format='col'
                title='Que quieres recibir'
            >
                {QueQuieresRecibirItems.map((item, index) => (
                    <ListTile
                        key={index}
                        tileName={item.tileName}
                        type={item.type}
                        onChange={item.onChange}
                        icon={item.icon}
                    />
                ))}
            </OptionList>
            <OptionList
                format='col'
                title='Por donde'
            >
                {PorDondeItems.map((item, index) => (
                    <ListTile
                        key={index}
                        tileName={item.tileName}
                        type={item.type}
                        onChange={item.onChange}
                        icon={item.icon}
                    />
                ))}
            </OptionList>
            <Button
                format='col'
                title="Guardar preferencias"
                color='blue'
                icon={<LuSun/>}
            />
        </ColSection>
    )
}