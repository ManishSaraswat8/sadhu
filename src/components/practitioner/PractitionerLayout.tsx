import { ReactNode } from "react";
import { usePractitionerAuth } from "@/hooks/usePractitionerAuth";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PractitionerSidebar } from "./PractitionerSidebar";

interface PractitionerLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  headerActions?: ReactNode;
}

export function PractitionerLayout({
  children,
  title,
  headerActions,
}: PractitionerLayoutProps) {
  const { isPractitioner, loading } = usePractitionerAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect happens in hook)
  if (!isPractitioner) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PractitionerSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <SidebarTrigger className="lg:hidden" />
                
                {title && (
                  <div className="text-xl font-heading font-semibold text-foreground">
                    {typeof title === 'string' ? <h1>{title}</h1> : title}
                  </div>
                )}
              </div>

              {headerActions && (
                <div className="flex items-center gap-2">
                  {headerActions}
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

