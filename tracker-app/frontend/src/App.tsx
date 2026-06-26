import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useApplications,
  useStats,
  useWishlist,
  useDeleteWishlistItem,
} from "@/api/hooks";
import type { ApplicationOut, ApplicationIn, WishlistItemOut } from "@/api/types";
import { MetricsBar } from "@/components/MetricsBar";
import { FollowUpAlert } from "@/components/FollowUpAlert";
import { FilterTabs } from "@/components/FilterTabs";
import { AppTable } from "@/components/AppTable";
import { AppModal } from "@/components/AppModal";
import { WishlistTable } from "@/components/WishlistTable";
import { WishlistModal } from "@/components/WishlistModal";

const queryClient = new QueryClient();

function AppContent() {
  const { data: applications = [], isLoading, isError } = useApplications();
  const { data: stats } = useStats();
  const { data: wishlistItems = [] } = useWishlist();
  const deleteWishlistItem = useDeleteWishlistItem();

  const [activeTab, setActiveTab] = useState<"aplicaciones" | "wishlist">("aplicaciones");
  const [activeFilter, setActiveFilter] = useState<string>("todas");
  const [editingApp, setEditingApp] = useState<ApplicationOut | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Prefill when creating application from wishlist item
  const [prefillData, setPrefillData] = useState<Partial<ApplicationIn> | null>(null);
  const [promotingWishlistId, setPromotingWishlistId] = useState<string | null>(null);

  // Wishlist modal states
  const [editingWishlistItem, setEditingWishlistItem] = useState<WishlistItemOut | null>(null);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  function openAdd() {
    setEditingApp(null);
    setPrefillData(null);
    setPromotingWishlistId(null);
    setIsModalOpen(true);
  }

  function openEdit(app: ApplicationOut) {
    setEditingApp(app);
    setPrefillData(null);
    setPromotingWishlistId(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingApp(null);
    setPrefillData(null);
    setPromotingWishlistId(null);
  }

  function openAddWishlist() {
    setEditingWishlistItem(null);
    setIsWishlistModalOpen(true);
  }

  function openEditWishlist(item: WishlistItemOut) {
    setEditingWishlistItem(item);
    setIsWishlistModalOpen(true);
  }

  function closeWishlistModal() {
    setIsWishlistModalOpen(false);
    setEditingWishlistItem(null);
  }

  function handlePromoteWishlist(item: WishlistItemOut) {
    setPrefillData({
      empresa: item.nombre,
      link: item.link,
      notas: item.notas,
    });
    setPromotingWishlistId(item.id);
    setIsModalOpen(true);
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
        {activeTab === "aplicaciones" ? (
          <button
            onClick={openAdd}
            className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162d4a]"
          >
            + Nueva aplicación
          </button>
        ) : (
          <button
            onClick={openAddWishlist}
            className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162d4a]"
          >
            + Nueva propuesta
          </button>
        )}
      </div>

      {/* Top Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("aplicaciones")}
            className={`border-b-2 py-4 px-1 text-sm font-semibold transition-all ${
              activeTab === "aplicaciones"
                ? "border-[#1E3A5F] text-[#1E3A5F]"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Aplicaciones ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`border-b-2 py-4 px-1 text-sm font-semibold transition-all ${
              activeTab === "wishlist"
                ? "border-[#1E3A5F] text-[#1E3A5F]"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Propuestas Guardadas ({wishlistItems.length})
          </button>
        </nav>
      </div>

      {activeTab === "aplicaciones" ? (
        <>
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
        </>
      ) : (
        <WishlistTable
          items={wishlistItems}
          onEdit={openEditWishlist}
          onPromote={handlePromoteWishlist}
        />
      )}

      {/* Application Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingApp={editingApp}
        prefillData={prefillData}
        onAppCreated={() => {
          if (promotingWishlistId) {
            deleteWishlistItem.mutate(promotingWishlistId);
          }
        }}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={closeWishlistModal}
        editingItem={editingWishlistItem}
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
