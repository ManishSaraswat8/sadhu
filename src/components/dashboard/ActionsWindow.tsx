import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday } from "date-fns";
import { CheckCircle2, Circle, Calendar, User, Target, TrendingUp, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ActionRecommendation {
  id: string;
  title: string;
  description: string | null;
  action_type: string;
  frequency: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  session: {
    scheduled_at: string;
    practitioner: {
      name: string;
    };
  };
}

export const ActionsWindow = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actions, setActions] = useState<ActionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  useEffect(() => {
    if (user) {
      loadActions();
    }
  }, [user]);

  const loadActions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Note: This assumes action_recommendations table exists
      // For now, we'll create a placeholder that will work once the table is created
      const { data, error } = await supabase
        .from("action_recommendations")
        .select(`
          id,
          title,
          description,
          action_type,
          frequency,
          due_date,
          completed,
          completed_at,
          created_at,
          session:session_schedules (
            scheduled_at,
            practitioner:practitioners (
              name
            )
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet, show empty state
        console.log("Action recommendations table not found:", error);
        setActions([]);
      } else {
        setActions((data as any) || []);
      }
    } catch (error) {
      console.error("Error loading actions:", error);
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = async (actionId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("action_recommendations")
        .update({
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq("id", actionId);

      if (error) throw error;

      // Update local state
      setActions(actions.map(action =>
        action.id === actionId
          ? { ...action, completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
          : action
      ));

      toast({
        title: !currentStatus ? "Action Completed!" : "Action Reopened",
        description: !currentStatus ? "Great job on completing this action." : "Action marked as pending.",
      });
    } catch (error) {
      console.error("Error updating action:", error);
      toast({
        title: "Error",
        description: "Could not update action status.",
        variant: "destructive",
      });
    }
  };

  const getActionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily_practice: "bg-blue-500/10 text-blue-500",
      mindfulness: "bg-purple-500/10 text-purple-500",
      physical: "bg-green-500/10 text-green-500",
      emotional: "bg-pink-500/10 text-pink-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[type] || colors.other;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
  };

  const filteredActions = actions.filter(action => {
    if (filter === 'pending') return !action.completed;
    if (filter === 'completed') return action.completed;
    if (filter === 'overdue') return !action.completed && isOverdue(action.due_date);
    return true;
  });

  const stats = {
    total: actions.length,
    completed: actions.filter(a => a.completed).length,
    pending: actions.filter(a => !a.completed).length,
    overdue: actions.filter(a => !a.completed && isOverdue(a.due_date)).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-light mb-2">Action Recommendations</h1>
        <p className="text-muted-foreground">
          Daily practices and recommendations from your practitioners
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <Circle className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading actions...</p>
              </CardContent>
            </Card>
          ) : filteredActions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium mb-2">
                  {filter === 'all' ? 'No Actions Yet' : `No ${filter} actions`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all'
                    ? "Your practitioner will assign action recommendations after your 1:1 sessions."
                    : `You don't have any ${filter} actions at the moment.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredActions.map((action) => {
                const overdue = isOverdue(action.due_date);
                return (
                  <Card
                    key={action.id}
                    className={`hover:shadow-md transition-shadow ${
                      action.completed ? 'opacity-75' : ''
                    } ${overdue ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={action.completed}
                          onCheckedChange={() => toggleAction(action.id, action.completed)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className={`font-medium ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {action.title}
                              </h3>
                              {action.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              )}
                            </div>
                            <Badge className={getActionTypeColor(action.action_type)}>
                              {action.action_type.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {action.session && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {action.session.practitioner.name}
                              </div>
                            )}
                            {action.due_date && (
                              <div className={`flex items-center gap-1 ${overdue ? 'text-amber-500 font-medium' : ''}`}>
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(action.due_date), "MMM d, yyyy")}
                                {overdue && <span className="ml-1">(Overdue)</span>}
                              </div>
                            )}
                            {action.frequency && (
                              <span>Frequency: {action.frequency}</span>
                            )}
                          </div>

                          {action.completed && action.completed_at && (
                            <div className="text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed on {format(new Date(action.completed_at), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

