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
    SidebarTrigger,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from "@/components/ui/sidebar"

import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
} from "@/components/ui/collapsible"

import { ChevronRight, Home, Film, Filter } from "lucide-react";

import { NavLink } from "react-router-dom"

const items = [
    {
        title: "ホーム",
        url: "/",
        icon: Home
    },
    {
        title: "動画リスト",
        url: "/videos",
        icon: Film
    },
    {
        title: "スキップ単語リスト",
        url: "/skip_words_list",
        icon: Filter
    },
    {
        title: "日本語文法リスト",
        url: "/grammar_list",
        icon: Filter
    },
    {
        title: "その他",
        url: "",
        icon: Filter,
        children: [
            {
                title: "慣用句",
                url: "/others/Idioms",
                icon: Filter
            }
        ]
    }
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
                            {
                                items.map((item) => {
                                    if (item.children?.length) {
                                        return (
                                            <Collapsible
                                                key={item.title}
                                                asChild
                                                defaultOpen
                                                className="group/collapsible"
                                            >
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton>
                                                            <item.icon />
                                                            <span>{item.title}</span>
                                                            <ChevronRight
                                                                className="
                                                                    ml-auto
                                                                    transition-transform
                                                                    duration-200
                                                                    group-data-[state=open]/collapsible:rotate-90
                                                                "
                                                            />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>

                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {item.children.map((child) => (
                                                                <SidebarMenuSubItem key={child.title}>
                                                                    <SidebarMenuSubButton asChild>
                                                                        <NavLink to={child.url}>
                                                                            <child.icon />
                                                                            <span>{child.title}</span>
                                                                        </NavLink>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            ))}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        )
                                    }

                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild>
                                                <NavLink to={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })
                            }
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