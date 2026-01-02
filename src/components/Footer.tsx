import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import sadhuLogo from "@/assets/sadhu-logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <img src={sadhuLogo} alt="Sadhu" className="h-16 w-auto" />
            <p className="text-muted-foreground text-sm">
              Transform pain into peace through ancient wisdom and modern technology.
            </p>
            <a 
              href="https://www.instagram.com/sadhu.io.official?igsh=eHYwbmltNzRpM3Vz&utm_source=qr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </a>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg text-foreground">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/sadhu-board-info" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Sadhu Board
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Classes & Pricing
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg text-foreground">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/become-practitioner" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Become a Practitioner
                </Link>
              </li>
              <li>
                <Link to="/auth/practitioner" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Practitioner Login
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Sadhu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
