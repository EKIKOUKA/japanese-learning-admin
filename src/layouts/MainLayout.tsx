import { Outlet } from "react-router-dom";
import {SidebarProvider, SidebarInset } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"

export function MainLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    )
}