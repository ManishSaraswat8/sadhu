import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  id: string;
  question_text: string;
  display_order: number;
  is_active: boolean;
}

interface Option {
  id: string;
  question_id: string;
  option_value: string;
  option_label: string;
  score: number;
  display_order: number;
}

interface Result {
  id: string;
  title: string;
  score_min: number;
  score_max: number;
  description: string;
  best_use: string;
  display_order: number;
  is_active: boolean;
}

export const ReadinessTestManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);
  const [deletingOption, setDeletingOption] = useState<string | null>(null);
  const [deletingResult, setDeletingResult] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "results">("questions");

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["readiness-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_test_questions")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Question[];
    },
  });

  // Fetch options for a question
  const { data: options } = useQuery({
    queryKey: ["readiness-options", selectedQuestionId],
    queryFn: async () => {
      if (!selectedQuestionId) return [];
      const { data, error } = await supabase
        .from("readiness_test_options")
        .select("*")
        .eq("question_id", selectedQuestionId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Option[];
    },
    enabled: !!selectedQuestionId,
  });

  // Fetch results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["readiness-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_test_results")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Result[];
    },
  });

  // Question mutations
  const questionMutation = useMutation({
    mutationFn: async (data: Partial<Question> & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("readiness_test_questions")
          .update({
            question_text: data.question_text,
            display_order: data.display_order,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("readiness_test_questions")
          .insert({
            question_text: data.question_text,
            display_order: data.display_order || 0,
            is_active: data.is_active !== false,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-questions"] });
      setEditingQuestion(null);
      toast({ title: "Success", description: "Question saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save question",
        variant: "destructive",
      });
    },
  });

  // Option mutations
  const optionMutation = useMutation({
    mutationFn: async (data: Partial<Option> & { id?: string; question_id: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("readiness_test_options")
          .update({
            option_value: data.option_value,
            option_label: data.option_label,
            score: data.score,
            display_order: data.display_order,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("readiness_test_options")
          .insert({
            question_id: data.question_id,
            option_value: data.option_value,
            option_label: data.option_label,
            score: data.score || 0,
            display_order: data.display_order || 0,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-options"] });
      setEditingOption(null);
      toast({ title: "Success", description: "Option saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save option",
        variant: "destructive",
      });
    },
  });

  // Result mutations
  const resultMutation = useMutation({
    mutationFn: async (data: Partial<Result> & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("readiness_test_results")
          .update({
            title: data.title,
            score_min: data.score_min,
            score_max: data.score_max,
            description: data.description,
            best_use: data.best_use,
            display_order: data.display_order,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("readiness_test_results")
          .insert({
            title: data.title,
            score_min: data.score_min || 0,
            score_max: data.score_max || 48,
            description: data.description || "",
            best_use: data.best_use || "",
            display_order: data.display_order || 0,
            is_active: data.is_active !== false,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-results"] });
      setEditingResult(null);
      toast({ title: "Success", description: "Result saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save result",
        variant: "destructive",
      });
    },
  });

  // Delete mutations
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("readiness_test_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-questions"] });
      setDeletingQuestion(null);
      setSelectedQuestionId(null);
      toast({ title: "Success", description: "Question deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("readiness_test_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-options"] });
      setDeletingOption(null);
      toast({ title: "Success", description: "Option deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete option",
        variant: "destructive",
      });
    },
  });

  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("readiness_test_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-results"] });
      setDeletingResult(null);
      toast({ title: "Success", description: "Result deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete result",
        variant: "destructive",
      });
    },
  });

  if (questionsLoading || resultsLoading) {
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
          <h2 className="text-2xl font-heading font-semibold">Readiness Test Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage test questions, options, and results
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "questions" | "results")}>
        <TabsList>
          <TabsTrigger value="questions">Questions & Options</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Questions List */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Questions</CardTitle>
                <Dialog open={editingQuestion !== null && !editingQuestion.id} onOpenChange={(open) => !open && setEditingQuestion(null)}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() =>
                        setEditingQuestion({
                          id: "",
                          question_text: "",
                          display_order: (questions?.length || 0),
                          is_active: true,
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Question</DialogTitle>
                      <DialogDescription>Add a new readiness test question</DialogDescription>
                    </DialogHeader>
                    {editingQuestion && (
                      <QuestionForm
                        question={editingQuestion}
                        onSave={(data) => questionMutation.mutate(data)}
                        onCancel={() => setEditingQuestion(null)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questions?.map((question) => (
                    <div
                      key={question.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedQuestionId === question.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedQuestionId(question.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{question.question_text}</span>
                            {!question.is_active && (
                              <span className="text-xs text-muted-foreground">(Inactive)</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Order: {question.display_order}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingQuestion(question);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingQuestion(question.id);
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

            {/* Options List */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>
                  Options
                  {selectedQuestionId && questions?.find((q) => q.id === selectedQuestionId) && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - {questions.find((q) => q.id === selectedQuestionId)?.question_text.substring(0, 30)}...
                    </span>
                  )}
                </CardTitle>
                {selectedQuestionId && (
                  <Dialog open={editingOption !== null && !editingOption.id} onOpenChange={(open) => !open && setEditingOption(null)}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() =>
                          setEditingOption({
                            id: "",
                            question_id: selectedQuestionId,
                            option_value: "",
                            option_label: "",
                            score: 0,
                            display_order: (options?.length || 0),
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Option</DialogTitle>
                        <DialogDescription>Add a new answer option</DialogDescription>
                      </DialogHeader>
                      {editingOption && (
                        <OptionForm
                          option={editingOption}
                          onSave={(data) => optionMutation.mutate(data)}
                          onCancel={() => setEditingOption(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {!selectedQuestionId ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a question to view options
                  </p>
                ) : (
                  <div className="space-y-2">
                    {options?.map((option) => (
                      <div
                        key={option.id}
                        className="p-3 border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.option_value})</span>
                            <span className="text-sm">{option.option_label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {option.score} | Order: {option.display_order}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOption(option)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingOption(option.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {options?.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No options for this question yet
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Test Results</CardTitle>
              <Dialog open={editingResult !== null && !editingResult.id} onOpenChange={(open) => !open && setEditingResult(null)}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() =>
                      setEditingResult({
                        id: "",
                        title: "",
                        score_min: 0,
                        score_max: 48,
                        description: "",
                        best_use: "",
                        display_order: (results?.length || 0),
                        is_active: true,
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Result
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Result</DialogTitle>
                    <DialogDescription>Add a new test result category</DialogDescription>
                  </DialogHeader>
                  {editingResult && (
                    <ResultForm
                      result={editingResult}
                      onSave={(data) => resultMutation.mutate(data)}
                      onCancel={() => setEditingResult(null)}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results?.map((result) => (
                  <Accordion key={result.id} type="single" collapsible>
                    <AccordionItem value={result.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div>
                            <span className="font-medium">{result.title}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              (Score: {result.score_min}-{result.score_max})
                            </span>
                            {!result.is_active && (
                              <span className="text-xs text-muted-foreground ml-2">(Inactive)</span>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line mb-2">
                              {result.description}
                            </p>
                            <p className="text-sm font-medium">
                              Best Use: {result.best_use}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingResult(result)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingResult(result.id)}
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
                {results?.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No results configured yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Question Dialog */}
      {editingQuestion && editingQuestion.id && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingQuestion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <QuestionForm
              question={editingQuestion}
              onSave={(data) => questionMutation.mutate(data)}
              onCancel={() => setEditingQuestion(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Option Dialog */}
      {editingOption && editingOption.id && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingOption(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Option</DialogTitle>
            </DialogHeader>
            <OptionForm
              option={editingOption}
              onSave={(data) => optionMutation.mutate(data)}
              onCancel={() => setEditingOption(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Result Dialog */}
      {editingResult && editingResult.id && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingResult(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Result</DialogTitle>
            </DialogHeader>
            <ResultForm
              result={editingResult}
              onSave={(data) => resultMutation.mutate(data)}
              onCancel={() => setEditingResult(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialogs */}
      <AlertDialog open={deletingQuestion !== null} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the question and all its options. This action cannot be undone.
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

      <AlertDialog open={deletingOption !== null} onOpenChange={(open) => !open && setDeletingOption(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingOption && deleteOptionMutation.mutate(deletingOption)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingResult !== null} onOpenChange={(open) => !open && setDeletingResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Result?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingResult && deleteResultMutation.mutate(deletingResult)}
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

interface QuestionFormProps {
  question: Partial<Question>;
  onSave: (data: Partial<Question> & { id?: string }) => void;
  onCancel: () => void;
}

const QuestionForm = ({ question, onSave, onCancel }: QuestionFormProps) => {
  const [questionText, setQuestionText] = useState(question.question_text || "");
  const [displayOrder, setDisplayOrder] = useState(question.display_order || 0);
  const [isActive, setIsActive] = useState(question.is_active !== false);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="questionText">Question Text</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter the question"
          rows={3}
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
              question_text: questionText,
              display_order: displayOrder,
              is_active: isActive,
            })
          }
          disabled={!questionText.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </DialogFooter>
    </div>
  );
};

interface OptionFormProps {
  option: Partial<Option>;
  onSave: (data: Partial<Option> & { id?: string; question_id: string }) => void;
  onCancel: () => void;
}

const OptionForm = ({ option, onSave, onCancel }: OptionFormProps) => {
  const [optionValue, setOptionValue] = useState(option.option_value || "");
  const [optionLabel, setOptionLabel] = useState(option.option_label || "");
  const [score, setScore] = useState(option.score || 0);
  const [displayOrder, setDisplayOrder] = useState(option.display_order || 0);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="optionValue">Option Value (A, B, C, D, E)</Label>
        <Input
          id="optionValue"
          value={optionValue}
          onChange={(e) => setOptionValue(e.target.value.toUpperCase())}
          placeholder="A"
          maxLength={1}
        />
      </div>
      <div>
        <Label htmlFor="optionLabel">Option Label</Label>
        <Input
          id="optionLabel"
          value={optionLabel}
          onChange={(e) => setOptionLabel(e.target.value)}
          placeholder="Enter the option text"
        />
      </div>
      <div>
        <Label htmlFor="score">Score</Label>
        <Input
          id="score"
          type="number"
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value) || 0)}
          min={0}
          max={4}
        />
      </div>
      <div>
        <Label htmlFor="oDisplayOrder">Display Order</Label>
        <Input
          id="oDisplayOrder"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({
              ...option,
              option_value: optionValue,
              option_label: optionLabel,
              score,
              display_order: displayOrder,
              question_id: option.question_id || "",
            })
          }
          disabled={!optionValue.trim() || !optionLabel.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </DialogFooter>
    </div>
  );
};

interface ResultFormProps {
  result: Partial<Result>;
  onSave: (data: Partial<Result> & { id?: string }) => void;
  onCancel: () => void;
}

const ResultForm = ({ result, onSave, onCancel }: ResultFormProps) => {
  const [title, setTitle] = useState(result.title || "");
  const [scoreMin, setScoreMin] = useState(result.score_min || 0);
  const [scoreMax, setScoreMax] = useState(result.score_max || 48);
  const [description, setDescription] = useState(result.description || "");
  const [bestUse, setBestUse] = useState(result.best_use || "");
  const [displayOrder, setDisplayOrder] = useState(result.display_order || 0);
  const [isActive, setIsActive] = useState(result.is_active !== false);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rTitle">Title</Label>
        <Input
          id="rTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Adaptive / Exploratory Readiness"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scoreMin">Score Min</Label>
          <Input
            id="scoreMin"
            type="number"
            value={scoreMin}
            onChange={(e) => setScoreMin(parseInt(e.target.value) || 0)}
            min={0}
            max={48}
          />
        </div>
        <div>
          <Label htmlFor="scoreMax">Score Max</Label>
          <Input
            id="scoreMax"
            type="number"
            value={scoreMax}
            onChange={(e) => setScoreMax(parseInt(e.target.value) || 48)}
            min={0}
            max={48}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="rDescription">Description</Label>
        <Textarea
          id="rDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter the result description"
          rows={6}
        />
      </div>
      <div>
        <Label htmlFor="bestUse">Best Use</Label>
        <Input
          id="bestUse"
          value={bestUse}
          onChange={(e) => setBestUse(e.target.value)}
          placeholder="e.g., Occasional practice, skill-building"
        />
      </div>
      <div>
        <Label htmlFor="rDisplayOrder">Display Order</Label>
        <Input
          id="rDisplayOrder"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="rIsActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="rIsActive">Active</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({
              ...result,
              title,
              score_min: scoreMin,
              score_max: scoreMax,
              description,
              best_use: bestUse,
              display_order: displayOrder,
              is_active: isActive,
            })
          }
          disabled={!title.trim() || !description.trim() || !bestUse.trim() || scoreMin > scoreMax}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </DialogFooter>
    </div>
  );
};
