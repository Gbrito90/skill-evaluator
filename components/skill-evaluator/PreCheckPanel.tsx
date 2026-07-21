"use client";

import { ArrowRight, Warning } from "@phosphor-icons/react/dist/ssr";
import type { PreCheckAnswers } from "@/lib/skill-evaluator/types";

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{question}</p>
      <div className="flex gap-2">
        {[
          { label: "Sim", v: true },
          { label: "Não", v: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${
              value === opt.v
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PreCheckPanel({
  answers,
  onChange,
  onContinue,
}: {
  answers: PreCheckAnswers;
  onChange: (answers: PreCheckAnswers) => void;
  onContinue: () => void;
}) {
  const answered = answers.repeatsRegularly !== null && answers.nameableInSentence !== null;
  const unfavorable = answers.repeatsRegularly === false || answers.nameableInSentence === false;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-1 font-mono text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Antes do relatório
      </p>
      <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Teste de 2 perguntas
      </h2>

      <div className="flex flex-col gap-5">
        <YesNoQuestion
          question="A tarefa se repete de verdade, ou foi só uma vez?"
          value={answers.repeatsRegularly}
          onChange={(v) => onChange({ ...answers, repeatsRegularly: v })}
        />
        <YesNoQuestion
          question="Você consegue nomear o processo inteiro em uma frase?"
          value={answers.nameableInSentence}
          onChange={(v) => onChange({ ...answers, nameableInSentence: v })}
        />
      </div>

      {answered && unfavorable && (
        <div className="mt-5 flex gap-3 rounded-lg bg-amber-500/10 p-3 ring-1 ring-inset ring-amber-500/20">
          <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Pelo framework, essa pode não ser candidata a skill: tarefa única ou processo
            vago viram sprawl no primeiro branch. Considere usar um prompt normal em vez de
            escrever um SKILL.md. Você ainda pode seguir para o relatório completo.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={!answered}
        onClick={onContinue}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform enabled:hover:bg-blue-500 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      >
        Ver relatório completo
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
