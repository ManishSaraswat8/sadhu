import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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

const ReadinessTest = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  // Fetch questions
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["readiness-questions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_test_questions")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Question[];
    },
  });

  // Fetch all options
  const { data: allOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ["readiness-options-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_test_options")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Option[];
    },
  });

  // Fetch results
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["readiness-results-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_test_results")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Result[];
    },
  });

  // Transform data for component use
  const questions = questionsData?.map((q) => ({
    id: q.id,
    question: q.question_text,
    options: (allOptions || [])
      .filter((opt) => opt.question_id === q.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((opt) => ({
        value: opt.option_value,
        label: opt.option_label,
        score: opt.score,
      })),
  })) || [];

  const results = resultsData || [];

  const handleAnswer = (value: string) => {
    const questionId = questions[currentQuestion]?.id;
    if (questionId) {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResult = () => {
    let score = 0;
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        const option = q.options.find((opt) => opt.value === answer);
        if (option) {
          score += option.score;
        }
      }
    });

    setTotalScore(score);
    setShowResult(true);
  };

  const getResult = (): Result | null => {
    if (totalScore === null || results.length === 0) return null;
    
    // Find the result that matches the score range
    const matchingResult = results.find(
      (r) => totalScore >= r.score_min && totalScore <= r.score_max
    );
    
    return matchingResult || results[results.length - 1]; // Fallback to last result
  };

  const currentQuestionData = questions[currentQuestion];
  const currentAnswer = currentQuestionData ? answers[currentQuestionData.id] : undefined;
  const canProceed = currentAnswer !== undefined;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const result = getResult();

  if (questionsLoading || optionsLoading || resultsLoading) {
    return (
      <>
        <Helmet>
          <title>Readiness Test | Sadhu</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-32 pb-16">
            <div className="container mx-auto px-6 max-w-3xl">
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Helmet>
          <title>Readiness Test | Sadhu</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-32 pb-16">
            <div className="container mx-auto px-6 max-w-3xl">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Readiness test is not available at the moment. Please check back later.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (showResult && result) {
    return (
      <>
        <Helmet>
          <title>Readiness Test Results | Sadhu</title>
          <meta name="description" content="Your Sadhu practice readiness assessment results" />
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-32 pb-16">
            <div className="container mx-auto px-6 max-w-3xl">
              <div className="mb-8">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>

              <Card className="border-primary/20">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-heading text-foreground">
                    {result.title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Score Range: {result.score_min}–{result.score_max}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {result.description}
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="font-semibold text-foreground mb-2">Best Use:</h3>
                    <p className="text-muted-foreground">{result.best_use}</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button asChild className="flex-1" variant="default">
                      <Link to="/sadhu-board">Get Your Sadhu Board</Link>
                    </Button>
                    <Button asChild className="flex-1" variant="outline">
                      <Link to="/pricing">View Pricing</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <>
      <Helmet>
        <title>Readiness Test | Sadhu</title>
        <meta name="description" content="Take the Sadhu practice readiness test to discover your nervous system readiness level" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="mb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-heading text-foreground">
                  {currentQuestionData?.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQuestionData?.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className="flex-1 cursor-pointer text-foreground"
                      >
                        <span className="font-medium mr-2">{option.value})</span>
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="flex-1"
                  >
                    {isLastQuestion ? "See Results" : "Next"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ReadinessTest;
