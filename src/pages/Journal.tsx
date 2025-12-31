import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, BookOpen, Calendar, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserLayout } from "@/components/UserLayout";
import AIChatBot from "@/components/AIChatBot";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: "peaceful" | "neutral" | "challenged";
  sessionId?: string; // Optional link to session
}

const moodEmojis = {
  peaceful: "🪷",
  neutral: "☁️",
  challenged: "🔥",
};

const Journal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState("");
  const [currentMood, setCurrentMood] = useState<"peaceful" | "neutral" | "challenged">("neutral");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ practitioner: string; date: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check for session_id and mood from URL params (from session completion)
  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    const moodParam = searchParams.get('mood') as "peaceful" | "neutral" | "challenged" | null;
    
    if (sessionIdParam && user) {
      setSessionId(sessionIdParam);
      if (moodParam && ['peaceful', 'neutral', 'challenged'].includes(moodParam)) {
        setCurrentMood(moodParam);
      }
      // Load session info
      loadSessionInfo(sessionIdParam);
      // Auto-open writing mode
      setIsWriting(true);
    }
  }, [searchParams, user]);

  const loadSessionInfo = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("session_schedules")
        .select(`
          scheduled_at,
          practitioner:practitioners (
            name
          )
        `)
        .eq("id", sessionId)
        .eq("client_id", user!.id)
        .single();

      if (!error && data) {
        setSessionInfo({
          practitioner: (data as any).practitioner.name,
          date: new Date((data as any).scheduled_at).toLocaleDateString(),
        });
      }
    } catch (error) {
      console.error("Error loading session info:", error);
    }
  };

  // Load entries from localStorage for now (can be migrated to Supabase later)
  useEffect(() => {
    const saved = localStorage.getItem(`journal-${user?.id}`);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, [user]);

  const saveEntry = () => {
    if (!currentEntry.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      // Update existing entry
      const updatedEntries = entries.map(entry =>
        entry.id === editingId
          ? { ...entry, content: currentEntry, mood: currentMood }
          : entry
      );
      setEntries(updatedEntries);
      localStorage.setItem(`journal-${user?.id}`, JSON.stringify(updatedEntries));
      
      toast({
        title: "Entry Updated",
        description: "Your journal entry has been updated.",
      });
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: currentEntry,
        mood: currentMood,
        ...(sessionId && { sessionId }), // Link to session if available
      };

      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem(`journal-${user?.id}`, JSON.stringify(updatedEntries));

      toast({
        title: "Entry Saved",
        description: "Your journal entry has been saved.",
      });
    }

    setCurrentEntry("");
    setCurrentMood("neutral");
    setIsWriting(false);
    setEditingId(null);
    setSessionId(null);
    setSessionInfo(null);
    // Clear URL params
    navigate('/journal', { replace: true });
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setCurrentEntry(entry.content);
    setCurrentMood(entry.mood);
    setIsWriting(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCurrentEntry("");
    setCurrentMood("neutral");
    setIsWriting(false);
    setSessionId(null);
    setSessionInfo(null);
  };

  const handleDeleteClick = (entryId: string) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;

    const updatedEntries = entries.filter(entry => entry.id !== entryToDelete);
    setEntries(updatedEntries);
    localStorage.setItem(`journal-${user?.id}`, JSON.stringify(updatedEntries));

    toast({
      title: "Entry Deleted",
      description: "Your journal entry has been deleted.",
    });

    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || !user) {
    return null;
  }

  return (
    <UserLayout
      title="Journal"
      headerActions={
        !isWriting && (
          <Button variant="teal" onClick={() => setIsWriting(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        )
      }
    >
      <div className="max-w-2xl mx-auto">
          {/* New Entry / Edit Form */}
          {isWriting && (
            <Card className="mb-8 animate-scale-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {editingId ? 'Edit Entry' : formatDate(new Date().toISOString())}
                  </CardTitle>
                  {editingId && (
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {sessionInfo && !editingId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Session with {sessionInfo.practitioner} on {sessionInfo.date}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mood Selector */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">How are you feeling?</label>
                  <div className="flex gap-2">
                    {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((mood) => (
                      <Button
                        key={mood}
                        variant={currentMood === mood ? "teal" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMood(mood)}
                        className="flex gap-2"
                      >
                        <span>{moodEmojis[mood]}</span>
                        <span className="capitalize">{mood}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Entry Content */}
                <Textarea
                  placeholder="Reflect on your practice today... What did you notice? What insights arose?"
                  value={currentEntry}
                  onChange={(e) => setCurrentEntry(e.target.value)}
                  rows={6}
                  className="resize-none"
                />

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={editingId ? cancelEdit : () => setIsWriting(false)}>
                    Cancel
                  </Button>
                  <Button variant="teal" onClick={saveEntry}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update Entry' : 'Save Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entries List */}
          {entries.length === 0 && !isWriting ? (
            <div className="text-center py-16 animate-fade-in">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-heading mb-2">Start Your Journal</h2>
              <p className="text-muted-foreground mb-6">
                Record your insights and track your transformation journey
              </p>
              <Button variant="teal" onClick={() => setIsWriting(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Write First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <Card 
                  key={entry.id} 
                  className="animate-slide-up group hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(entry.date)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{moodEmojis[entry.mood]}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => startEdit(entry)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(entry.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>

      <AIChatBot />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Journal Entry"
        description="Are you sure you want to delete this journal entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </UserLayout>
  );
};

export default Journal;
