import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {Toaster} from "sonner"

export function MainLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                <Outlet />
            </SidebarInset>

            <Toaster />
        </SidebarProvider>
    )
}