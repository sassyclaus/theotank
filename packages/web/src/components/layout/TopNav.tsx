import { Link, NavLink } from "react-router";
import { Menu, X, User } from "lucide-react";
import { navLinks } from "@/data/navigation";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopNavProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function TopNav({ mobileMenuOpen, onToggleMobileMenu }: TopNavProps) {
  const isMobile = useIsMobile();

  return (
    <header className="border-b border-surface bg-nav-bg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="font-serif text-2xl font-bold text-text-primary">
          TheoTank
        </Link>

        {!isMobile && (
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "font-semibold text-text-primary underline decoration-gold decoration-2 underline-offset-[6px]"
                      : "text-text-secondary hover:text-text-primary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button variant="ghost" size="icon" aria-label="User menu">
              <User className="h-5 w-5" />
            </Button>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
