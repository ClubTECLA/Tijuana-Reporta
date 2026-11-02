import SearchBar from "@/app/SearchBar";
import ColSection from "@/components/layout/ColSection";
import RowSection from "@/components/layout/RowSection";

export default function UserView() {
    return(
        <ColSection
            title="Usuarios"

        >
            <RowSection>
                <SearchBar
                  
                />
                
            </RowSection>
        </ColSection>
    );
}