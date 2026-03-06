import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

export default function ConfirmationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "1") {
      setVisible(true);
      // Clean the URL without triggering a reload
      const url = new URL(window.location.href);
      url.searchParams.delete("confirmed");
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-teal/10 bg-teal-light">
      <div className="mx-auto flex max-w-[800px] items-center gap-3 px-6 py-3">
        <CheckCircle size={20} className="shrink-0 text-teal" strokeWidth={1.75} />
        <p className="flex-1 text-sm font-medium text-teal">
          Your email is confirmed — you're on the waitlist! We'll be in touch.
        </p>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-md p-1 text-teal/60 transition-colors hover:bg-teal/10 hover:text-teal"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
