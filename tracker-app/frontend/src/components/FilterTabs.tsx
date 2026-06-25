import type { ApplicationOut } from "@/api/types";
import { STATUS_LABELS, STATUS_ORDER, type Estado } from "@/constants/status";

interface FilterTabsProps {
  applications: ApplicationOut[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export function FilterTabs({
  applications,
  activeFilter,
  setActiveFilter,
}: FilterTabsProps) {
  // Count from full unfiltered list
  const countsByStatus = STATUS_ORDER.reduce<Record<string, number>>(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.estado === status).length;
      return acc;
    },
    {}
  );

  const activeStatuses = STATUS_ORDER.filter(
    (s) => (countsByStatus[s] ?? 0) > 0
  );

  const tabBase =
    "rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer border";
  const activeStyle = "bg-[#1E3A5F] text-white border-[#1E3A5F]";
  const inactiveStyle =
    "bg-white text-gray-600 border-[#E5E7EB] hover:border-[#1E3A5F] hover:text-[#1E3A5F]";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={`${tabBase} ${activeFilter === "todas" ? activeStyle : inactiveStyle}`}
        onClick={() => setActiveFilter("todas")}
      >
        Todas ({applications.length})
      </button>

      {activeStatuses.map((status) => (
        <button
          key={status}
          className={`${tabBase} ${activeFilter === status ? activeStyle : inactiveStyle}`}
          onClick={() => setActiveFilter(status)}
        >
          {STATUS_LABELS[status as Estado]} ({countsByStatus[status]})
        </button>
      ))}
    </div>
  );
}
