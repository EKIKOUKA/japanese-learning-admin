import { logout } from "@/lib/auth";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {Toaster} from "sonner"

export function MainLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                <div className="flex justify-end px-4 py-2"><button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => void logout()}>ログアウト</button></div>
                <Outlet />
            </SidebarInset>

            <Toaster />
        </SidebarProvider>
    )
}