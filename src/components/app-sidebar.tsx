import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarTrigger
} from "@/components/ui/sidebar"
import { Home, Film, Filter } from "lucide-react";

import { NavLink } from "react-router-dom"

const items = [
    {
        title: "Dashboard",
        url: "/",
        icon: Home
    },
    {
        title: "Videos",
        url: "/videos",
        icon: Film
    },
    {
        title: "Filters",
        url: "/filters",
        icon: Filter
    },
]

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Japanese Learning
                    </SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarTrigger />
            </SidebarFooter>
        </Sidebar>
    )
}