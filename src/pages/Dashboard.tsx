import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Brain, BookOpen, Video, User, Crown, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ActionChecklist } from "@/components/ActionChecklist";
import { WelcomeVideoDialog } from "@/components/WelcomeVideoDialog";
import { UserLayout } from "@/components/UserLayout";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { OnlineSessions } from "@/components/dashboard/OnlineSessions";
import { InPersonSessions } from "@/components/dashboard/InPersonSessions";
import { ActionsWindow } from "@/components/dashboard/ActionsWindow";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIChatBot from "@/components/AIChatBot";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { subscribed, plan, loading: subLoading, openCustomerPortal, checkSubscription } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check for subscription success from Stripe redirect
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      toast({
        title: "Subscription Activated!",
        description: "Welcome to Sadhu Meditation Guide. Your journey begins now.",
      });
      checkSubscription();
    }
  }, [searchParams, toast, checkSubscription]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription management.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UserLayout
      headerActions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      }
    >
      {/* Dashboard Stats Overview */}
      <DashboardStats />

      <Tabs defaultValue="getting-started" className="w-full">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-6">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="w-full justify-start h-auto p-1 bg-transparent">
              <TabsTrigger value="getting-started" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="online" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Online Sessions
              </TabsTrigger>
              <TabsTrigger value="in-person" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                In-Person Sessions
              </TabsTrigger>
              <TabsTrigger value="journal" className="flex items-center gap-2" asChild>
                <Link to="/journal">
                  <BookOpen className="w-4 h-4" />
                  Journal
                </Link>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Actions
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="getting-started" className="mt-0">
          <GettingStarted />
        </TabsContent>
        <TabsContent value="online" className="mt-0">
          <OnlineSessions />
        </TabsContent>
        <TabsContent value="in-person" className="mt-0">
          <InPersonSessions />
        </TabsContent>
        <TabsContent value="actions" className="mt-0">
          <ActionsWindow />
        </TabsContent>
      </Tabs>

      {/* Welcome Video Dialog - shows on first login */}
      <WelcomeVideoDialog userId={user.id} />

      {/* AI Support Chat */}
      <AIChatBot />
    </UserLayout>
  );
};

export default Dashboard;
