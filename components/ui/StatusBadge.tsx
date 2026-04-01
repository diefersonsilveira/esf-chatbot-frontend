import { cn, STATUS_LABEL, STATUS_COLOR, STATUS_DOT } from "@/lib/utils";
import type { AtendimentoStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: AtendimentoStatus;
  size?: "sm" | "md";
  dot?: boolean;
}

export function StatusBadge({ status, size = "md", dot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        STATUS_COLOR[status],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[status])}
        />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}
