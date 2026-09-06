import { useLocation, Link } from "react-router-dom"
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

const items = [
    {
        title: "ホーム",
        url: "/",
        icon: Home
    }, {
        title: "シャドーイング",
        url: "",
        icon: Film,
        children: [
            {
                title: "カテゴリ",
                url: "/shadowing/category",
                icon: Film
            }, {
                title: "動画の追加再生リスト",
                url: "/shadowing/playlist",
                icon: Film
            }, {
                title: "動画リスト",
                url: "/shadowing/videos",
                icon: Film
            }, {
                title: "スキップ単語リスト",
                url: "/shadowing/skip_words_list",
                icon: Filter
            }
        ]
    }, {
        title: "日本語文法リスト",
        url: "/grammar_list",
        icon: Filter
    }, {
        title: "その他",
        url: "",
        icon: Filter,
        children: [
            {
                title: "慣用句",
                url: "/others/Idioms",
                icon: Filter
            }, {
                title: "映像作品リスト",
                url: "/others/media_products",
                icon: Filter
            }
        ]
    }
]

export function AppSidebar() {
    const { pathname } = useLocation()

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>管理システム</SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {
                                items.map((item) => {
                                    const isParentActive = item.children?.some(
                                        (child) => pathname === child.url
                                    )

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
                                                        <SidebarMenuButton isActive={isParentActive}>
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
                                                            {item.children.map((child) => {
                                                                const isChildActive = pathname === child.url

                                                                return (
                                                                    <SidebarMenuSubItem key={child.title}>
                                                                        <SidebarMenuSubButton isActive={isChildActive} asChild>
                                                                            <Link to={child.url}>
                                                                                <child.icon/>
                                                                                <span>{child.title}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                )
                                                            })}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        )
                                    }

                                    const isSingleActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)

                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton isActive={isSingleActive} asChild>
                                                <Link to={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
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