import { ActiveCorpora } from "@/components/admin/research/ActiveCorpora";
import { InDevelopment } from "@/components/admin/research/InDevelopment";
import { Roadmap } from "@/components/admin/research/Roadmap";
import { QueryLog } from "@/components/admin/research/QueryLog";

export default function Research() {
  return (
    <div className="space-y-8">
      {/* Active Corpora */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Active Corpora
        </h2>
        <ActiveCorpora />
      </section>

      {/* In Development */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          In Development
        </h2>
        <InDevelopment />
      </section>

      {/* Roadmap */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Roadmap
        </h2>
        <Roadmap />
      </section>

      {/* Query Log */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Query Log
        </h2>
        <QueryLog />
      </section>
    </div>
  );
}
