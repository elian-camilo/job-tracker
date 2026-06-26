import type { WishlistItemOut } from "@/api/types";
import { useDeleteWishlistItem } from "@/api/hooks";

interface WishlistTableProps {
  items: WishlistItemOut[];
  onEdit: (item: WishlistItemOut) => void;
  onPromote: (item: WishlistItemOut) => void;
}

export function WishlistTable({ items, onEdit, onPromote }: WishlistTableProps) {
  const deleteItem = useDeleteWishlistItem();

  function handleDelete(id: string, nombre: string) {
    if (window.confirm(`¿Eliminar la propuesta "${nombre}" de la lista?`)) {
      deleteItem.mutate(id);
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E7EB] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Propuesta</th>
            <th className="px-4 py-3">Notas</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                No hay propuestas guardadas. ¡Agrega una para comenzar!
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{item.nombre}</span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                        title="Ver enlace"
                      >
                        🔗
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-pre-line max-w-md truncate">
                  {item.notas ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPromote(item)}
                      className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Postular
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded px-2 py-1 text-xs font-medium text-[#1E3A5F] hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.nombre)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
