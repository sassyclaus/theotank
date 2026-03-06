import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { TopNav } from "./TopNav";
import { MobileMenu } from "./MobileMenu";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-40">
        <TopNav
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </div>
      <main>
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
