import { Plus, RefreshCw, Eye, Trash2, Users, Bot } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "wouter";

const menuItems = [
  { label: "Dashboard", icon: Eye, href: "/", id: "dashboard" },
  { label: "Create UID", icon: Plus, href: "/create-uid", id: "create" },
  { label: "Update UID", icon: RefreshCw, href: "/update-uid", id: "update" },
  { label: "All UIDs", icon: Eye, href: "/all-uids", id: "all" },
  { label: "Delete UID", icon: Trash2, href: "/delete-uid", id: "delete" },
  { label: "User Management", icon: Users, href: "/users", id: "users" },
  { label: "Bot Management", icon: Bot, href: "/bots", id: "bots" },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white">UID Whitelist</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild className="hover:bg-white/10">
                    <Link href={item.href} data-testid={`link-${item.id}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
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
