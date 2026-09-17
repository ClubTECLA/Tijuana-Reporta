export default function AuthPage() {
    return(
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold mb-4">Sign In</h1>
            <form className="flex flex-col items-center">
                <input type="text" placeholder="Username" className="border border-gray-300 rounded-md p-2 mb-4 w-64" />
                <input type="password" placeholder="Password" className="border border-gray-300 rounded-md p-2 mb-4 w-64" />
                <button type="submit" className="bg-blue-500 text-white rounded-md p-2 w-64">Sign In</button>
            </form>
        </div>  
    )
}