import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApplications, useStats } from "@/api/hooks";
import type { ApplicationOut } from "@/api/types";
import { MetricsBar } from "@/components/MetricsBar";
import { FollowUpAlert } from "@/components/FollowUpAlert";
import { FilterTabs } from "@/components/FilterTabs";
import { AppTable } from "@/components/AppTable";
import { AppModal } from "@/components/AppModal";

const queryClient = new QueryClient();

function AppContent() {
  const { data: applications = [], isLoading, isError } = useApplications();
  const { data: stats } = useStats();

  const [activeFilter, setActiveFilter] = useState<string>("todas");
  const [editingApp, setEditingApp] = useState<ApplicationOut | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openAdd() {
    setEditingApp(null);
    setIsModalOpen(true);
  }

  function openEdit(app: ApplicationOut) {
    setEditingApp(app);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingApp(null);
  }

  const filteredApps =
    activeFilter === "todas"
      ? applications
      : applications.filter((a) => a.estado === activeFilter);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Cargando...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error al cargar los datos. Verificá que el backend esté corriendo en el
        puerto 8000.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Job Tracker</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Seguimiento de aplicaciones laborales
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162d4a]"
        >
          + Nueva aplicación
        </button>
      </div>

      {/* Metrics */}
      {stats && (
        <div className="mb-6">
          <MetricsBar stats={stats} />
        </div>
      )}

      {/* Follow-up alert */}
      {stats && stats.need_followup.length > 0 && (
        <div className="mb-4">
          <FollowUpAlert
            needFollowup={stats.need_followup}
            applications={applications}
          />
        </div>
      )}

      {/* Filter tabs */}
      {applications.length > 0 && (
        <div className="mb-4">
          <FilterTabs
            applications={applications}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>
      )}

      {/* Table or empty state */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-24 text-center">
          <span className="mb-3 text-5xl">🚀</span>
          <p className="text-lg font-semibold text-gray-700">
            Tu búsqueda empieza aquí
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Agrega tu primera aplicación.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 rounded-md bg-[#1E3A5F] px-5 py-2 text-sm font-medium text-white hover:bg-[#162d4a]"
          >
            + Nueva aplicación
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-16 text-center">
          <p className="text-sm text-gray-500">
            No hay aplicaciones con este estado.
          </p>
        </div>
      ) : (
        <AppTable applications={filteredApps} onEdit={openEdit} />
      )}

      {/* Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingApp={editingApp}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
