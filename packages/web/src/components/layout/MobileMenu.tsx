import { useRef } from "react";
import { NavLink } from "react-router";
import { SignUpButton, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { navLinks } from "@/data/navigation";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();

  return (
    <div
      ref={panelRef}
      className="overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out border-b border-surface bg-nav-bg md:hidden"
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
      }}
    >
      <div className="overflow-hidden">
        <nav className="flex flex-col gap-1 px-4 pt-2 pb-4">
          {isSignedIn && (
            <>
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
                      isActive
                        ? "bg-surface font-semibold text-text-primary"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="mt-2 border-t border-surface pt-3">
                <div className="flex items-center gap-3 px-4 py-3">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-lg font-medium text-text-secondary">
                    Account
                  </span>
                </div>
              </div>
            </>
          )}

          {!isSignedIn && (
            <div className="flex flex-col gap-2 pt-2">
              <SignUpButton mode="modal">
                <Button className="w-full bg-gold py-3 text-base font-semibold text-white hover:bg-gold/90">
                  Get Started
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  className="w-full border-teal py-3 text-base font-semibold text-teal hover:bg-teal-light"
                >
                  Sign In
                </Button>
              </SignInButton>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
