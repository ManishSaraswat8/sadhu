import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Play, Video, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const checklistItems = [
  { id: "setup", label: "Set up your Sadhu Board in a quiet space", completed: false },
  { id: "first-session", label: "Book your first session with a practitioner", completed: false },
  { id: "watch-guide", label: "Watch the Getting Started video", completed: false },
  { id: "read-guide", label: "Read the best practices guide", completed: false },
  { id: "explore", label: "Explore the Step-by-Step guides", completed: false },
];

export const GettingStarted = () => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedItems(newCompleted);
    // Save to localStorage
    localStorage.setItem('getting-started-checklist', JSON.stringify(Array.from(newCompleted)));
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('getting-started-checklist');
    if (saved) {
      setCompletedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-light">
          Welcome to Your Practice
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Begin your journey of transformation and inner peace. Follow these steps to get started with your Sadhu meditation practice.
        </p>
      </div>

      {/* Getting Started Video */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Getting Started Video
              </CardTitle>
              <CardDescription className="mt-1">
                Learn the fundamentals of Sadhu meditation practice
              </CardDescription>
            </div>
            <Badge variant="secondary">Essential</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <Play className="w-16 h-16 text-primary/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Video Player</p>
              <p className="text-xs text-muted-foreground mt-1">
                "How to Get Started with Your Sadhu Board"
              </p>
            </div>
          </div>
          <Button className="w-full" size="lg">
            <Play className="w-4 h-4 mr-2" />
            Watch Video
          </Button>
        </CardContent>
      </Card>

      {/* Quick Start Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            Quick Start Checklist
          </CardTitle>
          <CardDescription>
            Complete these steps to begin your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checklistItems.map((item) => {
              const isCompleted = completedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <label className="flex-1 cursor-pointer">
                    <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
                      {item.label}
                    </span>
                  </label>
                  {isCompleted && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices Guide */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Best Practices Guide
            </CardTitle>
            <CardDescription>
              Essential guidelines for safe and effective practice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Start with shorter sessions and gradually increase duration</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Listen to your body and stop if you experience excessive pain</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Maintain proper posture and breathing throughout</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Practice in a quiet, distraction-free environment</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/step-by-step">
                Read Full Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Step-by-Step Guides
            </CardTitle>
            <CardDescription>
              Video tutorials for different practice types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Standing Practice</span>
                <Badge variant="outline">5 videos</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Laying Practice</span>
                <Badge variant="outline">3 videos</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Hand Practice</span>
                <Badge variant="outline">2 videos</Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/step-by-step">
                View All Guides
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle>Ready to Begin?</CardTitle>
          <CardDescription>
            Book your first session with an experienced practitioner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1" size="lg">
              <Link to="/sessions">
                Book Your First Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1" size="lg">
              <Link to="/dashboard/meditation">
                Try AI Meditation Guide
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

