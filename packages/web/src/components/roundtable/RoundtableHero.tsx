import { MessageCircle } from "lucide-react";

export function RoundtableHero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
        <MessageCircle className="h-6 w-6 text-teal" />
      </div>
      <h1 className="font-serif text-4xl font-bold text-text-primary">
        Roundtable
      </h1>
      <p className="mt-3 text-lg text-text-secondary">
        Convene a panel of theological minds around your question.
      </p>
    </section>
  );
}
