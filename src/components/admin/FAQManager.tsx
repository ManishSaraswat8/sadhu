import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Edit, Trash2, GripVertical, Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FAQSection {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface FAQQuestion {
  id: string;
  section_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

export const FAQManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<FAQSection | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<FAQQuestion | null>(null);
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Fetch FAQ sections
  const { data: sections, isLoading } = useQuery({
    queryKey: ["faq-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_sections")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as FAQSection[];
    },
  });

  // Fetch questions for a section
  const { data: questions } = useQuery({
    queryKey: ["faq-questions", selectedSectionId],
    queryFn: async () => {
      if (!selectedSectionId) return [];
      const { data, error } = await supabase
        .from("faq_questions")
        .select("*")
        .eq("section_id", selectedSectionId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as FAQQuestion[];
    },
    enabled: !!selectedSectionId,
  });

  // Create/Update section mutation
  const sectionMutation = useMutation({
    mutationFn: async (data: Partial<FAQSection> & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("faq_sections")
          .update({
            title: data.title,
            display_order: data.display_order,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("faq_sections")
          .insert({
            title: data.title,
            display_order: data.display_order || 0,
            is_active: data.is_active !== false,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-sections"] });
      setEditingSection(null);
      toast({ title: "Success", description: "FAQ section saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save FAQ section",
        variant: "destructive",
      });
    },
  });

  // Create/Update question mutation
  const questionMutation = useMutation({
    mutationFn: async (data: Partial<FAQQuestion> & { id?: string; section_id: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("faq_questions")
          .update({
            question: data.question,
            answer: data.answer,
            display_order: data.display_order,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("faq_questions")
          .insert({
            section_id: data.section_id,
            question: data.question,
            answer: data.answer,
            display_order: data.display_order || 0,
            is_active: data.is_active !== false,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-questions"] });
      setEditingQuestion(null);
      toast({ title: "Success", description: "FAQ question saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save FAQ question",
        variant: "destructive",
      });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faq_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-sections"] });
      setDeletingSection(null);
      setSelectedSectionId(null);
      toast({ title: "Success", description: "FAQ section deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ section",
        variant: "destructive",
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faq_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-questions"] });
      setDeletingQuestion(null);
      toast({ title: "Success", description: "FAQ question deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ question",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold">FAQ Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage FAQ sections and questions
          </p>
        </div>
        <Dialog open={editingSection !== null && !editingSection.id} onOpenChange={(open) => !open && setEditingSection(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSection({ id: "", title: "", display_order: (sections?.length || 0), is_active: true })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add FAQ Section</DialogTitle>
              <DialogDescription>Create a new FAQ section</DialogDescription>
            </DialogHeader>
            {editingSection && (
              <SectionForm
                section={editingSection}
                onSave={(data) => {
                  sectionMutation.mutate(data);
                }}
                onCancel={() => setEditingSection(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections List */}
        <Card>
          <CardHeader>
            <CardTitle>FAQ Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections?.map((section) => (
                <div
                  key={section.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSectionId === section.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedSectionId(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{section.title}</span>
                        {!section.is_active && (
                          <span className="text-xs text-muted-foreground">(Inactive)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Order: {section.display_order}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSection(section);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSection(section.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>
              Questions
              {selectedSectionId && sections?.find((s) => s.id === selectedSectionId) && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {sections.find((s) => s.id === selectedSectionId)?.title}
                </span>
              )}
            </CardTitle>
            {selectedSectionId && (
              <Dialog open={editingQuestion !== null && !editingQuestion.id} onOpenChange={(open) => !open && setEditingQuestion(null)}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditingQuestion({
                        id: "",
                        section_id: selectedSectionId,
                        question: "",
                        answer: "",
                        display_order: (questions?.length || 0),
                        is_active: true,
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add FAQ Question</DialogTitle>
                    <DialogDescription>Add a new question to this section</DialogDescription>
                  </DialogHeader>
                  {editingQuestion && (
                    <QuestionForm
                      question={editingQuestion}
                      onSave={(data) => {
                        questionMutation.mutate(data);
                      }}
                      onCancel={() => setEditingQuestion(null)}
                    />
                  )}
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedSectionId ? (
              <p className="text-muted-foreground text-center py-8">
                Select a section to view questions
              </p>
            ) : (
              <div className="space-y-2">
                {questions?.map((question) => (
                  <Accordion key={question.id} type="single" collapsible>
                    <AccordionItem value={question.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="text-sm font-medium">{question.question}</span>
                          {!question.is_active && (
                            <span className="text-xs text-muted-foreground ml-2">(Inactive)</span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {question.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingQuestion(question)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingQuestion(question.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
                {questions?.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No questions in this section yet
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Section Dialog */}
      {editingSection && editingSection.id && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingSection(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit FAQ Section</DialogTitle>
              <DialogDescription>Update FAQ section details</DialogDescription>
            </DialogHeader>
            <SectionForm
              section={editingSection}
              onSave={(data) => {
                sectionMutation.mutate(data);
              }}
              onCancel={() => setEditingSection(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && editingQuestion.id && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingQuestion(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit FAQ Question</DialogTitle>
              <DialogDescription>Update question details</DialogDescription>
            </DialogHeader>
            <QuestionForm
              question={editingQuestion}
              onSave={(data) => {
                questionMutation.mutate(data);
              }}
              onCancel={() => setEditingQuestion(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Section Confirmation */}
      <AlertDialog open={deletingSection !== null} onOpenChange={(open) => !open && setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ Section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the section and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSection && deleteSectionMutation.mutate(deletingSection)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog open={deletingQuestion !== null} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuestion && deleteQuestionMutation.mutate(deletingQuestion)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface SectionFormProps {
  section: Partial<FAQSection>;
  onSave: (data: Partial<FAQSection> & { id?: string }) => void;
  onCancel: () => void;
}

const SectionForm = ({ section, onSave, onCancel }: SectionFormProps) => {
  const [title, setTitle] = useState(section.title || "");
  const [displayOrder, setDisplayOrder] = useState(section.display_order || 0);
  const [isActive, setIsActive] = useState(section.is_active !== false);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Section Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Practice & Safety"
        />
      </div>
      <div>
        <Label htmlFor="displayOrder">Display Order</Label>
        <Input
          id="displayOrder"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({
              ...section,
              title,
              display_order: displayOrder,
              is_active: isActive,
            })
          }
          disabled={!title.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </DialogFooter>
    </div>
  );
};

interface QuestionFormProps {
  question: Partial<FAQQuestion>;
  onSave: (data: Partial<FAQQuestion> & { id?: string; section_id: string }) => void;
  onCancel: () => void;
}

const QuestionForm = ({ question, onSave, onCancel }: QuestionFormProps) => {
  const [questionText, setQuestionText] = useState(question.question || "");
  const [answer, setAnswer] = useState(question.answer || "");
  const [displayOrder, setDisplayOrder] = useState(question.display_order || 0);
  const [isActive, setIsActive] = useState(question.is_active !== false);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter the question"
        />
      </div>
      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter the answer"
          rows={8}
          className="resize-none"
        />
      </div>
      <div>
        <Label htmlFor="qDisplayOrder">Display Order</Label>
        <Input
          id="qDisplayOrder"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="qIsActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="qIsActive">Active</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({
              ...question,
              question: questionText,
              answer,
              display_order: displayOrder,
              is_active: isActive,
              section_id: question.section_id || "",
            })
          }
          disabled={!questionText.trim() || !answer.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </DialogFooter>
    </div>
  );
};
