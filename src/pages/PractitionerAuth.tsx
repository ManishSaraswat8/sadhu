import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import sadhuLogo from "@/assets/sadhu-logo.png";

const PractitionerAuth = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      checkPractitionerRole();
    }
  }, [user, loading]);

  const checkPractitionerRole = async () => {
    if (!user) return;
    
    setCheckingRole(true);
    
    // Check if user is a practitioner
    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (practitioner) {
      navigate("/practitioner");
    } else {
      toast({
        title: "Access Denied",
        description: "This account is not registered as a practitioner.",
        variant: "destructive",
      });
      // Sign out and stay on page
      await supabase.auth.signOut();
    }
    
    setCheckingRole(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for a password reset link.",
        });
        setMode('login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      }
      // Role check and redirect happens in useEffect
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">
          {checkingRole ? "Verifying practitioner access..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-block">
              <img src={sadhuLogo} alt="Sadhu" className="h-20 w-auto mx-auto" />
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Practitioner Portal</span>
            </div>
            <h2 className="mt-6 text-3xl font-heading font-light text-foreground">
              {mode === 'login' && "Practitioner Sign In"}
              {mode === 'forgot' && "Reset Password"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mode === 'login' && "Access your practitioner dashboard"}
              {mode === 'forgot' && "Enter your email to receive a reset link"}
            </p>
          </div>

          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-foreground font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button variant="teal" size="xl" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-foreground font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm text-foreground font-medium">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button variant="teal" size="xl" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In as Practitioner"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p>Only registered practitioners can access this portal.</p>
                <p className="mt-2">
                  Are you a client?{" "}
                  <Link to="/auth" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-card items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest/20 via-transparent to-teal-light/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-forest/10 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="relative z-10 text-center max-w-md space-y-6">
          <div className="w-24 h-24 bg-forest/20 rounded-full flex items-center justify-center mx-auto shadow-glow">
            <Stethoscope className="w-12 h-12 text-forest" />
          </div>
          <h3 className="text-2xl font-heading text-foreground">
            Practitioner Dashboard
          </h3>
          <ul className="text-left space-y-3 text-muted-foreground">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-forest" />
              Manage your client sessions
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-forest" />
              Set your availability
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-forest" />
              Track your earnings
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-forest" />
              Create action checklists
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PractitionerAuth;
