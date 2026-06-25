import type { ApplicationOut } from "@/api/types";
import { useCycleStatus, useDeleteApp } from "@/api/hooks";
import { StatusBadge } from "./StatusBadge";
import type { Estado } from "@/constants/status";

interface AppTableProps {
  applications: ApplicationOut[];
  onEdit: (app: ApplicationOut) => void;
}

function daysAgo(fecha: string): number {
  return Math.floor((Date.now() - Date.parse(fecha)) / 86_400_000);
}

const STALE_STATUSES: Estado[] = ["aplicado", "dm_enviado"];

export function AppTable({ applications, onEdit }: AppTableProps) {
  const cycleStatus = useCycleStatus();
  const deleteApp = useDeleteApp();

  function handleDelete(id: string, empresa: string) {
    if (window.confirm(`¿Eliminar la aplicación en ${empresa}?`)) {
      deleteApp.mutate(id);
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E7EB] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Empresa / Rol</th>
            <th className="px-4 py-3">Plataforma</th>
            <th className="px-4 py-3">Días</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Próximo paso</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const days = daysAgo(app.fecha);
            const isStale =
              STALE_STATUSES.includes(app.estado as Estado) && days >= 7;

            return (
              <tr
                key={app.id}
                className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{app.empresa}</div>
                  <div className="text-xs text-gray-500">{app.rol}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {app.plataforma ?? "—"}
                </td>
                <td
                  className={`px-4 py-3 ${
                    isStale ? "font-bold text-amber-600" : "text-gray-600"
                  }`}
                >
                  {days === 0 ? "Hoy" : `${days}d`}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    estado={app.estado as Estado}
                    onCycle={(next) => {
                      cycleStatus.mutate({
                        id: app.id,
                        next,
                        data: {
                          empresa: app.empresa,
                          rol: app.rol,
                          fecha: app.fecha,
                          estado: next,
                          plataforma: app.plataforma ?? undefined,
                          contacto: app.contacto ?? undefined,
                          proximo_paso: app.proximo_paso ?? undefined,
                          notas: app.notas ?? undefined,
                        },
                      });
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {app.proximo_paso ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(app)}
                      className="rounded px-2 py-1 text-xs font-medium text-[#1E3A5F] hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(app.id, app.empresa)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
