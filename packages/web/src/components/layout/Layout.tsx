import { useState } from "react";
import { Outlet } from "react-router";
import { TopNav } from "./TopNav";
import { MobileMenu } from "./MobileMenu";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <TopNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
