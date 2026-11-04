import Pagination from "@/components/ui/Pagination";

interface FooterUsersViewProps {
    userLenght: number;
    onChangePage: (page: number) => void;
    currentPage: number;
    pageSize: number;
}

export default function FooterUsersView({ userLenght, onChangePage, currentPage, pageSize }: FooterUsersViewProps){
    const totalPages = Math.max(1, Math.ceil(userLenght / pageSize));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const firstUser = userLenght === 0 ? 0 : (page - 1) * pageSize + 1;
    const lastUser = Math.min(page * pageSize, userLenght);
    
    return(
        <section className="flex flex-row justify-between items-center w-full px-3">
            <span className="text-gray-700 text-sm">
                {`Mostrando ${firstUser}-${lastUser} de ${userLenght}`}
            </span>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={onChangePage}
            />
        </section>
    )
}