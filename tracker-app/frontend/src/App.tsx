import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApplications } from "@/api/hooks";
import type { ApplicationOut } from "@/api/types";

const queryClient = new QueryClient();

function AppContent() {
  const { data: applications, isLoading, isError } = useApplications();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Cargando aplicaciones...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error al cargar las aplicaciones. Verificá que el backend esté corriendo.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] p-6">
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">Job Tracker</h1>
      <p className="mb-4 text-sm text-gray-500">
        {applications?.length ?? 0} aplicaciones cargadas
      </p>
      <ul className="space-y-2">
        {applications?.map((app: ApplicationOut) => (
          <li
            key={app.id}
            className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm"
          >
            <strong>{app.empresa}</strong> — {app.rol} ({app.estado})
          </li>
        ))}
      </ul>
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
