import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // If student attendance page, return minimal layout
    if (location.pathname.startsWith("/attendance/student/")) {
        return <div className="min-h-screen bg-background text-foreground">{children}</div>;
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full lg:ml-64 transition-all duration-200 ease-in-out">
                {/* Header */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 pb-32 lg:pb-6 overflow-y-auto w-full max-w-7xl mx-auto">
                    {children}
                </main>

                {/* Bottom Nav (Mobile Only) */}
                <BottomNav />
            </div>
        </div>
    );
}
