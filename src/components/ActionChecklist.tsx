import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: number;
  created_at: string;
}

interface ActionChecklistProps {
  clientId?: string;
  practitionerId?: string;
}

export const ActionChecklist = ({ clientId, practitionerId }: ActionChecklistProps = {}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use provided clientId or fall back to current user
  const targetClientId = clientId || user?.id;

  useEffect(() => {
    if (targetClientId) {
      fetchChecklist();
    }
  }, [targetClientId]);

  const fetchChecklist = async () => {
    if (!targetClientId) return;
    
    const { data, error } = await supabase
      .from("action_checklist")
      .select("*")
      .eq("client_id", targetClientId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching checklist:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const toggleComplete = async (itemId: string, currentCompleted: boolean) => {
    const { error } = await supabase
      .from("action_checklist")
      .update({ completed: !currentCompleted })
      .eq("id", itemId);

    if (error) {
      console.error("Error updating checklist item:", error);
    } else {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, completed: !currentCompleted } : item
      ));
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return <Badge variant="destructive">High</Badge>;
    if (priority >= 2) return <Badge variant="secondary">Medium</Badge>;
    return null;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Action Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-heading">
          <ClipboardList className="w-5 h-5 text-primary" />
          Your Action Checklist
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalized actions from your practitioner
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No action items yet</p>
            <p className="text-sm mt-1">Your practitioner will add tasks after your sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  item.completed 
                    ? "bg-muted/50 border-muted" 
                    : "bg-background border-border hover:border-primary/30"
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleComplete(item.id, item.completed)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.title}
                    </span>
                    {getPriorityBadge(item.priority)}
                  </div>
                  {item.description && (
                    <p className={`text-sm mt-1 ${item.completed ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                      {item.description}
                    </p>
                  )}
                  {item.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {format(new Date(item.due_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Progress indicator */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{items.filter(i => i.completed).length} of {items.length} completed</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ 
                    width: `${items.length > 0 ? (items.filter(i => i.completed).length / items.length) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
