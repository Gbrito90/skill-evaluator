import type { EvaluationReport } from "@/lib/skill-evaluator/types";
import { VerdictBadge } from "./VerdictBadge";

const OVERALL_MESSAGE: Record<EvaluationReport["overallVerdict"], string> = {
  good: "Pronta para uso. Nenhum eixo crítico encontrado.",
  warning: "Precisa de poda em pelo menos um eixo antes de confiar nela em produção.",
  critical: "Não recomendado usar assim. Pelo menos um eixo tem falha crítica.",
};

export function ScoreSummary({ report }: { report: EvaluationReport }) {
  const counts = report.axes.reduce(
    (acc, axis) => {
      acc[axis.verdict] += 1;
      return acc;
    },
    { good: 0, warning: 0, critical: 0 },
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Veredito geral</p>
          <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {OVERALL_MESSAGE[report.overallVerdict]}
          </p>
        </div>
        <VerdictBadge verdict={report.overallVerdict} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm text-zinc-500 sm:flex sm:gap-4 dark:text-zinc-400">
        <span className="whitespace-nowrap">{counts.good} bom</span>
        <span className="whitespace-nowrap">{counts.warning} atenção</span>
        <span className="whitespace-nowrap">{counts.critical} crítico</span>
        <span className="whitespace-nowrap">{report.wordCount} palavras no corpo</span>
      </div>
    </div>
  );
}
