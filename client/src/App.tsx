import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CreateUID from "@/pages/create-uid";
import UpdateUID from "@/pages/update-uid";
import AllUIDs from "@/pages/all-uids";
import DeleteUID from "@/pages/delete-uid";
import UserManagement from "@/pages/users";
import BotManagement from "@/pages/bots";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";

function Router({ token }: { token: string | null }) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    window.dispatchEvent(new Event("logout"));
    setLocation("/login");
  };

  if (!token) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 w-full">
        <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white" />
          <div className="flex items-center gap-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/10"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/create-uid" component={CreateUID} />
            <Route path="/update-uid" component={UpdateUID} />
            <Route path="/all-uids" component={AllUIDs} />
            <Route path="/delete-uid" component={DeleteUID} />
            <Route path="/users" component={UserManagement} />
            <Route path="/bots" component={BotManagement} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem("authToken"));
    };
    
    window.addEventListener("storage", handler);
    window.addEventListener("login-success", handler);
    window.addEventListener("logout", handler);
    
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("login-success", handler);
      window.removeEventListener("logout", handler);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <Toaster />
          <Router token={token} />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
