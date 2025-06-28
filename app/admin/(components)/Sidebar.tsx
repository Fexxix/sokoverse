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
  SidebarRail,
} from "@/components/ui/sidebar";
import { GamepadIcon, Home, Users } from "lucide-react";

// Better navItems config with `view` key
const navItems = [
  {
    title: "Dashboard",
    view: "dashboard",
    icon: Home,
  },
  {
    title: "Users",
    view: "users",
    icon: Users,
  },
];

export default function AppSidebar({
  activeView,
  setActiveView,
}: {
  activeView: string;
  setActiveView: (view: string) => void;
}) {
  return (
    <Sidebar
      variant="inset"
      className="border-r-2 border-[#e5e7eb] bg-white  font-admin "
    >
      <SidebarHeader className="p-4 bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex items-center justify-center w-8 h-8 bg-[#3b82f6] text-white rounded-md">
                  <GamepadIcon />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-gray-900">
                    Sokoverse Admin
                  </span>
                  <span className="text-xs text-gray-400">Game Management</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-4 bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-400 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === item.view}
                    onClick={() => setActiveView(item.view)}
                  >
                    <button
                      className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md bg-transparent
                  text-gray-400 border-none text-sm font-medium cursor-pointer transition-all mb-1
                  hover:bg-gray-50
                  ${activeView === item.view ? "bg-gray-100 text-gray-900" : ""}
                `}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
