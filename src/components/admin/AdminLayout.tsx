import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Outlet, Navigate } from "react-router-dom";

const AdminLayout = () => {
  const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-4 text-sm text-muted-foreground font-medium tracking-wide">
              Content Management
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
