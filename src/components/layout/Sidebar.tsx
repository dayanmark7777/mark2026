import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    Home,
    Users,
    GraduationCap,
    BookOpen,
    Mic2,
    ClipboardCheck,
    BarChart3,
    Settings,
    X,
} from "lucide-react";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Students", href: "/students", icon: Users },
    { label: "Academic Programs", href: "/courses", icon: GraduationCap },
    { label: "Courses", href: "/classes", icon: BookOpen },
    { label: "Lecturers", href: "/lecturers", icon: Mic2 },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();

    return (
        <>
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex flex-col w-64 transform bg-background border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-border shrink-0">
                    <span className="text-xl font-bold text-primary">DBC System</span>
                    <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-secondary text-primary border border-border/50"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-border mt-auto shrink-0">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                Beta Version
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={onClose}
                />
            )}
        </>
    );
}
