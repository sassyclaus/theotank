import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center lg:px-8">
      <h1 className="font-serif text-6xl font-bold text-text-primary">404</h1>
      <p className="mt-4 text-lg text-text-secondary">
        This page doesn't exist yet.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
}
