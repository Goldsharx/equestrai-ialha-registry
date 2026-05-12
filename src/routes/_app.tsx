import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader unreadCount={3} />
        <SidebarProvider>
          <div className="flex w-full flex-1">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-12 items-center border-b bg-card px-3">
                <SidebarTrigger />
              </div>
              <main className="flex-1 p-6">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}
