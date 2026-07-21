"use client";

import { Check } from "@phosphor-icons/react/dist/ssr";
import type { ManualCheckItem } from "@/lib/skill-evaluator/types";

export function ManualChecklist({
  items,
  checkedIds,
  onToggle,
}: {
  items: ManualCheckItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <p className="mb-3 font-mono text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Checklist manual
      </p>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const checked = checkedIds.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="flex w-full items-start gap-3 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    checked
                      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {checked && <Check weight="bold" className="size-3.5" />}
                </span>
                <span>
                  <span
                    className={`block text-sm font-medium ${
                      checked
                        ? "text-zinc-400 line-through dark:text-zinc-600"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
