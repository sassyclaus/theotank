import * as Dialog from "@radix-ui/react-dialog";
import { X, User } from "lucide-react";
import { NavLink } from "react-router";
import { navLinks } from "@/data/navigation";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-nav-bg p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300">
          <div className="flex items-center justify-between mb-8">
            <span className="font-serif text-2xl font-bold text-text-primary">
              TheoTank
            </span>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => onOpenChange(false)}
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
          </nav>

          <div className="mt-8 border-t border-surface pt-6">
            <button className="flex items-center gap-3 px-4 py-3 text-lg font-medium text-text-secondary hover:text-text-primary transition-colors">
              <User className="h-5 w-5" />
              Account
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
