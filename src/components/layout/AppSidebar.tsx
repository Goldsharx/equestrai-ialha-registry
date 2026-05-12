import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Rabbit,
  FilePlus,
  ArrowLeftRight,
  User,
  MessageSquare,
  Shield,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useLanguage } from "@/contexts/LanguageContext";

const main = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.myHorses", url: "/horses", icon: Rabbit },
  { titleKey: "nav.register", url: "/register", icon: FilePlus },
  { titleKey: "nav.transfer", url: "/transfer", icon: ArrowLeftRight },
  { titleKey: "nav.notifications", url: "/notifications", icon: Bell },
  { titleKey: "nav.chat", url: "/chat", icon: MessageSquare },
  { titleKey: "nav.profile", url: "/profile", icon: User },
] as const;

const adminItems = [{ titleKey: "nav.admin", url: "/admin", icon: Shield }] as const;

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => currentPath === p;
  const { t } = useLanguage();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-heading text-sm font-bold text-accent-foreground">
            I
          </div>
          <span className="font-heading text-base font-semibold text-accent group-data-[collapsible=icon]:hidden">
            EquestRai
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Registry</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
