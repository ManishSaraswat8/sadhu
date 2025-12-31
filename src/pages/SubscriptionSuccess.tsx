import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import sadhuLogo from "@/assets/sadhu-logo.png";

const SubscriptionSuccess = () => {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // If user is already logged in, just redirect to dashboard
    if (!authLoading && user) {
      toast({
        title: "Subscription Activated!",
        description: "Welcome to your 7-day free trial.",
      });
      navigate("/dashboard/meditation");
      return;
    }

    // Verify the session and create account if needed
    const verifySession = async () => {
      if (!sessionId) {
        setError("No session ID found");
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-subscription-session', {
          body: { sessionId }
        });

        if (error) throw error;

        setVerified(true);
        setCustomerEmail(data.email);
        setIsNewUser(data.isNewUser);

        if (data.isNewUser) {
          toast({
            title: "Account Created!",
            description: "Check your email to set your password, or sign in below.",
          });
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify subscription');
      } finally {
        setVerifying(false);
      }
    };

    if (!authLoading && !user) {
      verifySession();
    }
  }, [sessionId, user, authLoading, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;

    setIsLoggingIn(true);
    try {
      const { error } = await signIn(customerEmail, password);
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid password. Check your email for a password reset link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome!",
          description: "Your 7-day free trial has started.",
        });
        navigate("/dashboard/meditation");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!customerEmail) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(customerEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email to set your password.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/subscribe">
              <Button className="w-full">Try Again</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader className="text-center pb-2">
          <img src={sadhuLogo} alt="Sadhu" className="h-16 w-auto mx-auto mb-4" />
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">
            {verified ? "Subscription Activated!" : "Processing..."}
          </CardTitle>
          <CardDescription className="text-base">
            {isNewUser 
              ? "Your account has been created. Sign in to start your 7-day free trial."
              : "Your 7-day free trial has started. Sign in to continue."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success indicator */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">7-Day Free Trial Active</span>
          </div>

          {/* Login form */}
          {customerEmail && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={customerEmail}
                    disabled
                    className="pl-12 bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground font-medium">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline"
                  >
                    {isNewUser ? "Set password" : "Forgot password?"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={isNewUser ? "Check email for temporary password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In & Start Meditating"
                )}
              </Button>
            </form>
          )}

          {isNewUser && (
            <p className="text-sm text-center text-muted-foreground">
              We've sent a password setup link to your email. 
              You can also use the temporary password from that email to sign in now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
