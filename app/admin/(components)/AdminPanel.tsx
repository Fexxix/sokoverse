"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "./Sidebar";
import DashboardView from "./DashboardView";
import UsersPage from "./UsersPage";
import AnalyticsPage from "./AnalyticsPage";
import { useAuth } from "@/contexts/auth";

const adminEmailMap = {
  1: "fexxix@gmail.com",
  20: "shahwaizmughal940@gmail.com",
} as Record<number, string>;

export default function AdminPanel() {
  const [activeView, setActiveView] = useState("dashboard");
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeView) {
      case "users":
        return <UsersPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "dashboard":
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className=" bg-white min-h[100vh]">
      <SidebarProvider>
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset>
          {/* Top Navigation Bar */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
            <div className="flex items-center gap-2">
              <div className="text-black">
                <SidebarTrigger />
              </div>
              <div className="h-4 w-px  bg-gray-200" />
              <h1 className="text-lg font-semibold text-gray-900 m-0">
                Sokoverse Admin
              </h1>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full bg-transparent border-none p-0 cursor-pointer"
                >
                  <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                    <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                    <AvatarFallback className="bg-gray-100 text-gray-400 text-sm flex items-center justify-center w-full h-full">
                      AD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-gray-900 m-0">
                      Admin User
                    </p>
                    <p className="text-xs text-gray-400 m-0">
                      {adminEmailMap[user?.id ?? 0] ?? ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 h-px my-1" />
                <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-gray-50">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Main Content */}
          {renderContent()}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
