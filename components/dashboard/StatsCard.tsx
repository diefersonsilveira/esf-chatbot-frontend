import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-sky-600",
  iconBg = "bg-sky-50",
  trend,
}: StatsCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              <span>{trend.value >= 0 ? "↑" : "↓"}</span>
              <span>
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
