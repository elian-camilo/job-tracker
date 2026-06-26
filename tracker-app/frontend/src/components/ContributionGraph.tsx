import { useState, useMemo } from "react";
import type { ApplicationOut } from "@/api/types";

interface ContributionGraphProps {
  applications: ApplicationOut[];
}

export function ContributionGraph({ applications }: ContributionGraphProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Group applications by YYYY-MM-DD
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach((app) => {
      if (app.fecha) {
        const dateStr = app.fecha.slice(0, 10);
        map[dateStr] = (map[dateStr] || 0) + 1;
      }
    });
    return map;
  }, [applications]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Weekday index of first day (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = firstDay.getDay();

  // Total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create array of days for the grid
  const gridCells = useMemo(() => {
    const cells = [];
    
    // Add empty cells for padding (before first day of month)
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }
    
    // Add month days
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, "0");
      const monthStr = String(month + 1).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      cells.push({
        day,
        dateStr,
        count: counts[dateStr] || 0,
      });
    }
    
    return cells;
  }, [year, month, startDayOfWeek, totalDays, counts]);

  // Total applications in the selected month
  const totalInMonth = useMemo(() => {
    let sum = 0;
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, "0");
      const monthStr = String(month + 1).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      sum += counts[dateStr] || 0;
    }
    return sum;
  }, [year, month, totalDays, counts]);

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    const today = new Date();
    // Don't allow navigation beyond the current month + 1 year, just a reasonable limit
    if (year > today.getFullYear() + 1) return;
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Color classes
  function getColorClass(count: number) {
    if (count === 0) return "bg-[#EBEDF0] text-gray-500 hover:bg-[#D9DCDE]";
    if (count === 1) return "bg-[#C6F6D5] text-[#22543D] hover:bg-[#9AE6B4]";
    if (count === 2) return "bg-[#9AE6B4] text-[#22543D] hover:bg-[#68D391]";
    if (count === 3) return "bg-[#48BB78] text-white hover:bg-[#38A169]";
    return "bg-[#22543D] text-white hover:bg-[#1C4532]";
  }

  // Tooltip formatter
  function formatTooltip(dateStr: string, count: number) {
    const parts = dateStr.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const dateFormatted = d.toLocaleDateString("es-ES", options);
    if (count === 0) return `Sin aplicaciones el ${dateFormatted}`;
    if (count === 1) return `1 aplicación el ${dateFormatted}`;
    return `${count} aplicaciones el ${dateFormatted}`;
  }

  return (
    <div className="w-full rounded-[10px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1E3A5F]">Actividad diaria</h3>
          <p className="text-xs text-gray-500">
            {totalInMonth === 1 ? "1 aplicación este mes" : `${totalInMonth} aplicaciones este mes`}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 transition-colors"
          >
            &larr;
          </button>
          <button
            onClick={handleNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 transition-colors"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="mb-3 text-center text-xs font-semibold text-[#1E3A5F] select-none">
        {monthNames[month]} {year}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase select-none">
        <span>Dom</span>
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 mt-1.5">
        {gridCells.map((cell, index) => {
          if (cell === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          return (
            <div
              key={`day-${cell.day}`}
              className={`aspect-square flex items-center justify-center rounded-md transition-colors cursor-pointer relative group text-xs font-bold ${getColorClass(cell.count)}`}
            >
              {cell.day}
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded bg-[#1E3A5F] px-2 py-1 text-[10px] font-medium text-white shadow-md whitespace-nowrap group-hover:block">
                {formatTooltip(cell.dateStr, cell.count)}
                <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-0.5 rotate-45 bg-[#1E3A5F]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-1 text-[9px] text-gray-400 select-none">
        <span>Menos</span>
        <div className="h-2.5 w-2.5 rounded-sm bg-[#EBEDF0]" />
        <div className="h-2.5 w-2.5 rounded-sm bg-[#C6F6D5]" />
        <div className="h-2.5 w-2.5 rounded-sm bg-[#9AE6B4]" />
        <div className="h-2.5 w-2.5 rounded-sm bg-[#48BB78]" />
        <div className="h-2.5 w-2.5 rounded-sm bg-[#22543D]" />
        <span>Más</span>
      </div>
    </div>
  );
}
