import { CheckCircle, Warning, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { Verdict } from "@/lib/skill-evaluator/types";

const CONFIG: Record<Verdict, { label: string; classes: string; Icon: typeof CheckCircle }> = {
  good: {
    label: "Bom",
    classes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
    Icon: CheckCircle,
  },
  warning: {
    label: "Atenção",
    classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20",
    Icon: Warning,
  },
  critical: {
    label: "Crítico",
    classes: "bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20",
    Icon: XCircle,
  },
};

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" }) {
  const { label, classes, Icon } = CONFIG[verdict];
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-sm px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center rounded-full font-mono font-medium ${sizeClasses} ${classes}`}>
      <Icon weight="fill" className={size === "sm" ? "size-3.5" : "size-4"} />
      {label}
    </span>
  );
}
