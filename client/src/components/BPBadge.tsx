import { BPClassification, getClassificationInfo } from "@shared/bloodPressure";
import { cn } from "@/lib/utils";

interface BPBadgeProps {
  classification: BPClassification;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 font-medium",
  md: "text-sm px-2.5 py-1 font-medium",
  lg: "text-base px-3 py-1.5 font-semibold",
};

const colorMap: Record<BPClassification, string> = {
  hypotension: "bg-blue-50 text-blue-700 border border-blue-200",
  normal: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  elevated: "bg-amber-50 text-amber-700 border border-amber-200",
  hypertension_1: "bg-orange-50 text-orange-700 border border-orange-200",
  hypertension_2: "bg-red-50 text-red-700 border border-red-200",
  hypertension_3: "bg-rose-50 text-rose-800 border border-rose-200",
};

const dotColorMap: Record<BPClassification, string> = {
  hypotension: "bg-blue-500",
  normal: "bg-emerald-500",
  elevated: "bg-amber-500",
  hypertension_1: "bg-orange-500",
  hypertension_2: "bg-red-500",
  hypertension_3: "bg-rose-600",
};

export function BPBadge({ classification, size = "md", showIcon = true }: BPBadgeProps) {
  const info = getClassificationInfo(classification);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full",
        sizeClasses[size],
        colorMap[classification]
      )}
    >
      {showIcon && (
        <span className={cn("rounded-full flex-shrink-0", dotColorMap[classification], size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      )}
      {info.labelShort}
    </span>
  );
}
