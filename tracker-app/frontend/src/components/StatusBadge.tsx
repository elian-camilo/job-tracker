import {
  STATUS_COLORS,
  STATUS_LABELS,
  nextStatus,
  type Estado,
} from "@/constants/status";

interface StatusBadgeProps {
  estado: Estado;
  onCycle: (next: Estado) => void;
}

export function StatusBadge({ estado, onCycle }: StatusBadgeProps) {
  const { bg, text } = STATUS_COLORS[estado];

  return (
    <span
      onClick={() => onCycle(nextStatus(estado))}
      title="Click to advance status"
      style={{ backgroundColor: bg, color: text }}
      className="inline-block cursor-pointer select-none rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
    >
      {STATUS_LABELS[estado]}
    </span>
  );
}
