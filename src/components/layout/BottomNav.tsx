import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./Sidebar";

export function BottomNav() {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border lg:hidden shadow-elegant">
            <div className="grid grid-cols-4 gap-y-2 py-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center px-1 py-1 transition-all active:scale-95",
                                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 mb-0.5", isActive && "text-primary")} />
                            <span className="text-[9px] leading-tight truncate w-full text-center">{item.label}</span>
                            {isActive && (
                                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
