import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import sadhuLogo from "@/assets/sadhu-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    // If we're already on home page, scroll to top
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <img 
              src={sadhuLogo} 
              alt="Sadhu" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-heading text-lg text-foreground hidden sm:inline-block">Sadhu</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("about")} className="text-muted-foreground hover:text-foreground transition-colors">
              Our Mission
            </button>
            <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection("pain-points")} className="text-muted-foreground hover:text-foreground transition-colors">
              Pain Points
            </button>
            <button onClick={() => scrollToSection("research")} className="text-muted-foreground hover:text-foreground transition-colors">
              Research
            </button>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              // Show nothing while loading auth state
              null
            ) : user ? (
              // Show Dashboard and Logout when logged in
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              // Show Sign In and Get Started when not logged in
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="teal" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
