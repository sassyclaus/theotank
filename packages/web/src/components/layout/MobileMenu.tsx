import { useRef } from "react";
import { NavLink } from "react-router";
import { User } from "lucide-react";
import { navLinks } from "@/data/navigation";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
              <User className="h-5 w-5" />
              Account
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
