import type { StatsOut } from "@/api/types";

interface MetricsBarProps {
  stats: StatsOut;
}

interface MetricCardProps {
  label: string;
  value: string | number;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div
      className="flex flex-1 flex-col gap-1 rounded-[10px] border border-[#E5E7EB] bg-white px-5 py-4"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-2xl font-bold text-[#1E3A5F]">{value}</span>
    </div>
  );
}

export function MetricsBar({ stats }: MetricsBarProps) {
  return (
    <div className="flex gap-4">
      <MetricCard label="Total aplicadas" value={stats.total} />
      <MetricCard
        label="Tasa de respuesta"
        value={`${stats.response_rate.toFixed(1)}%`}
      />
      <MetricCard
        label="Entrevistas activas"
        value={stats.active_interviews}
      />
      <MetricCard label="Ofertas" value={stats.offers} />
    </div>
  );
}
