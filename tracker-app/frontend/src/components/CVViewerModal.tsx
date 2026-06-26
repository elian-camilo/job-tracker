

interface CVViewerModalProps {
  cvFilename: string | null;
  onClose: () => void;
}

export function CVViewerModal({ cvFilename, onClose }: CVViewerModalProps) {
  if (!cvFilename) return null;

  const cvUrl = `/api/applications/cv/${cvFilename}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[10px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">Ver CV adjunto</h2>
          <div className="flex items-center gap-3">
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Abrir en nueva pestaña
            </a>
            <button
              onClick={onClose}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 p-2">
          <iframe
            src={cvUrl}
            className="h-full w-full rounded-md border border-gray-300 bg-white"
            title="CV Viewer"
          />
        </div>
      </div>
    </div>
  );
}
