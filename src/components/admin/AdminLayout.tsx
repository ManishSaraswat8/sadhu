import { ReactNode } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  headerActions?: ReactNode;
  showSearch?: boolean;
}

export function AdminLayout({
  children,
  title,
  headerActions,
  showSearch = false,
}: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminAuth();

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin (redirect happens in hook)
  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <SidebarTrigger className="lg:hidden" />

                {title && (
                  <div className="text-xl font-heading font-semibold text-foreground">
                    {typeof title === 'string' ? <h1>{title}</h1> : title}
                  </div>
                )}

                {showSearch && (
                  <div className="flex-1 max-w-md mx-4">
                    <Input
                      type="search"
                      placeholder="Search orders, customers..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}

              {!title && !showSearch && !headerActions && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium">AD</span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
} 