import { useState, useEffect } from "react";
import { getWaitlistCount } from "@/lib/api";

export default function SocialProofCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getWaitlistCount().then(setCount).catch(() => {});
  }, []);

  if (count === null) {
    return (
      <p className="text-sm text-text-secondary/60">
        Founding members joining now
      </p>
    );
  }

  if (count === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Be among the first founding members
      </p>
    );
  }

  return (
    <p className="text-sm text-text-secondary">
      <span className="font-semibold text-teal">{count.toLocaleString()}</span>
      {" "}founding member{count !== 1 ? "s" : ""} and counting
    </p>
  );
}
