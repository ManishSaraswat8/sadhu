import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Calendar, History, Receipt, Video, BookOpen, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface CreditData {
  total_credits: number;
  package_credits: number;
  single_credits: number;
  credits: Array<{
    id: string;
    credits_remaining: number;
    package_id: string | null;
    session_type_id: string | null;
    purchased_at: string;
    expires_at: string | null;
  }>;
}

export function PastPurchases() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'credits' | 'history' | 'purchases'>('credits');

  useEffect(() => {
    if (user) {
      fetchCredits();
      fetchRecentSessions();
      fetchPurchases();
    }
  }, [user]);

  const fetchRecentSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          status,
          session_location,
          practitioner:practitioners (
            name
          )
        `)
        .eq("client_id", user.id)
        .in("status", ["completed", "scheduled", "in_progress"])
        .order("scheduled_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching recent sessions:", error);
      }

      if (!error && data) {
        // Load recordings for completed sessions
        const sessionsWithRecordings = await Promise.all(
          (data || []).map(async (session: any) => {
            if (session.status === 'completed') {
              const { data: recording } = await supabase
                .from("session_recordings" as any)
                .select("id, recording_url, status")
                .eq("session_id", session.id)
                .eq("status", "completed")
                .maybeSingle();

              return { ...session, recording: recording || null };
            }
            return session;
          })
        );
        setRecentSessions(sessionsWithRecordings);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("session_payments")
        .select(`
          id,
          total_amount,
          currency,
          status,
          created_at,
          session:session_schedules (
            id,
            scheduled_at,
            duration_minutes
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data) {
        setPurchases(data || []);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const fetchCredits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get fresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-session-credits', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;
      setCredits(data);
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const totalCredits = credits?.total_credits || 0;

  if (collapsed) {
    // Collapsed view - just show credits count
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <Card className="border-primary/20">
            <CardContent className="p-3 text-center">
              <Package className="w-4 h-4 text-primary mx-auto mb-1" />
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {totalCredits}
              </Badge>
            </CardContent>
          </Card>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Past Purchases</SidebarGroupLabel>
      <SidebarGroupContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="credits" className="text-xs p-1">
              <Package className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs p-1">
              <History className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs p-1">
              <Receipt className="w-3 h-3" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="mt-2">
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                {totalCredits > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Available Sessions</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {totalCredits}
                      </Badge>
                    </div>
                    
                    {credits && credits.credits.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        {credits.credits.slice(0, 3).map((credit) => {
                          const expiresAt = credit.expires_at ? new Date(credit.expires_at) : null;
                          const isExpiringSoon = expiresAt && expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                          const isExpired = expiresAt && expiresAt < new Date();
                          
                          return (
                            <div 
                              key={credit.id} 
                              className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3.5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-foreground">
                                    {credit.package_id 
                                      ? `${credit.credits_remaining} Package Session${credit.credits_remaining > 1 ? 's' : ''}`
                                      : `${credit.credits_remaining} Session${credit.credits_remaining > 1 ? 's' : ''}`
                                    }
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>Purchased {format(new Date(credit.purchased_at), "MMM d, yyyy")}</span>
                                    </div>
                                  </div>
                                </div>
                                {isExpired && (
                                  <Badge variant="destructive" className="text-xs font-medium px-2.5 py-0.5 flex-shrink-0">
                                    Expired
                                  </Badge>
                                )}
                                {isExpiringSoon && !isExpired && (
                                  <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex-shrink-0">
                                    Expiring Soon
                                  </Badge>
                                )}
                              </div>
                              {expiresAt && (
                                <div className={`flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-border/40 ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    {isExpired ? 'Expired' : 'Expires'} {format(expiresAt, "MMM d, yyyy")}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {credits.credits.length > 3 && (
                          <div className="text-xs text-muted-foreground pt-1 text-center">
                            +{credits.credits.length - 3} more credit{credits.credits.length - 3 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
                      No sessions available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-2">
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-2">
                {recentSessions.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Recent Sessions</span>
                      <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" asChild>
                        <Link to="/sessions">View All</Link>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {recentSessions.slice(0, 1).map((session) => {
                        const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                          scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
                          in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
                          completed: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' },
                          cancelled: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
                        };
                        const statusStyle = statusColors[session.status] || { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' };
                        const statusText = session.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        
                        return (
                          <div 
                            key={session.id} 
                            className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                          >
                            {/* Row 1: Title and Subtitle */}
                            <div className="mb-2">
                              <h4 className="font-semibold text-sm text-foreground">
                                {session.practitioner.name}
                              </h4>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {session.session_location === 'online' ? (
                                  <div className="flex items-center gap-1">
                                    <Video className="w-3 h-3" />
                                    <span>Online Session</span>
                                  </div>
                                ) : (
                                  <span>In-Person Session</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Row 3: Date (left) and Status (right, smaller) */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{format(new Date(session.scheduled_at), "MMM d, yyyy")}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] font-medium px-2 py-0.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}
                              >
                                {statusText}
                              </Badge>
                            </div>
                            
                            {session.status === 'completed' && (
                              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border/40">
                                {session.recording?.recording_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs hover:bg-primary/10 hover:text-primary"
                                    asChild
                                  >
                                    <a
                                      href={session.recording.recording_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="w-3.5 h-3.5 mr-1.5" />
                                      Recording
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs hover:bg-primary/10 hover:text-primary"
                                  asChild
                                >
                                  <Link to={`/journal?session_id=${session.id}`}>
                                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                                    Journal
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
                      No session history
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="mt-2">
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-2">
                {purchases.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Recent Purchases</span>
                      <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" asChild>
                        <Link to="/purchases">View All</Link>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {purchases.map((purchase) => {
                        const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                          completed: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' },
                          pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/20' },
                          failed: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
                          refunded: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' },
                        };
                        const statusStyle = statusColors[purchase.status] || { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' };
                        const statusText = purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1);
                        
                        return (
                          <div 
                            key={purchase.id} 
                            className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3.5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                          >
                            {/* Row 1: Title and Subtitle */}
                            <div className="mb-2.5">
                              <h4 className="font-semibold text-sm text-foreground">
                                {purchase.session
                                  ? `Session - ${format(new Date(purchase.session.scheduled_at), "MMM d, yyyy")}`
                                  : 'Session Package'}
                              </h4>
                              {purchase.session && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {purchase.session.duration_minutes} min session
                                </div>
                              )}
                            </div>
                            
                            {/* Row 2: Date (right aligned) */}
                            <div className="flex justify-end mb-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{format(new Date(purchase.created_at), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                            
                            {/* Row 3: Price (left) and Status (right, smaller) */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                <span className="text-[10px] text-muted-foreground">{purchase.currency?.toUpperCase()}</span>
                                <span className="text-sm font-semibold">${Number(purchase.total_amount).toFixed(2)}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] font-medium px-2 py-0.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}
                              >
                                {statusText}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
                      No purchase history
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs mt-2" asChild>
                      <Link to="/sessions/payment">Buy Sessions</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

